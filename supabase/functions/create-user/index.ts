import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Obtenemos el token JWT del usuario (Admin) que hace la petición
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Falta cabecera de autorización")
    
    // Cliente normal con el token del usuario para verificar permisos
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 1. Verificar que el que llama es Administrador
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    if (userError || !user) throw new Error("No autenticado")

    const { data: perfil, error: perfilError } = await userSupabase
      .from('perfiles')
      .select('rol, clinica_id')
      .eq('id', user.id)
      .single()
    
    if (perfilError || perfil.rol !== 'admin') {
      throw new Error("No tienes permisos de administrador para realizar esta acción")
    }

    // 2. Extraer datos del nuevo usuario
    const { email, password, rol, nombre, apellidos, especialidad } = await req.json()
    
    // Obligamos a que el nuevo usuario se cree en la misma clínica del administrador
    const targetClinicaId = perfil.clinica_id

    // 3. Cliente "Super Administrador" para saltarse restricciones de seguridad y crear el usuario
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Crear el nuevo usuario en auth.users
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirma el email automáticamente
    })

    if (createError) throw createError

    const newUserId = newAuthUser.user.id

    // 5. Insertar en doctores primero (si es doctor) para obtener el ID
    let doctorId = null;
    if (rol === 'doctor') {
      const { data: newDoctor, error: insertDoctorError } = await supabaseAdmin
        .from('doctores')
        .insert([{
          nombre,
          apellidos,
          especialidad,
          email,
          clinica_id: targetClinicaId,
          activo: true,
          color_calendario: '#3B82F6',
          horario: []
        }])
        .select('id')
        .single()
      
      if (insertDoctorError) throw insertDoctorError
      doctorId = newDoctor.id
    }

    // 6. Insertar el perfil y conectarlo con el doctor_id si existe
    const { error: insertPerfilError } = await supabaseAdmin
      .from('perfiles')
      .insert([{ 
        id: newUserId, 
        rol, 
        clinica_id: targetClinicaId,
        doctor_id: doctorId
      }])
    
    if (insertPerfilError) throw insertPerfilError

    return new Response(JSON.stringify({ success: true, userId: newUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
