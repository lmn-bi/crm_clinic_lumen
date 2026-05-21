const url = "https://yykbtwozsimsklnwjvue.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5a2J0d296c2ltc2tsbndqdnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Mjk5NTQsImV4cCI6MjA5NDQwNTk1NH0.TaG09PNf5YfdzZ8nDlUCcrzfTBiIoDURwCan1qkEddY";

async function main() {
  try {
    const doctorId = "b0000000-0000-0000-0000-000000000003";
    const targetDateStr = "2026-05-27"; // Next Wednesday
    
    console.log(`=== Testing RPC get_slots_disponibles for Doctor ${doctorId} on ${targetDateStr} ===`);
    
    const rpcRes = await fetch(`${url}/rest/v1/rpc/get_slots_disponibles`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_doctor_id: doctorId,
        p_fecha: targetDateStr,
        p_duracion: 30
      })
    });
    
    if (!rpcRes.ok) {
      console.error(`Error calling RPC: ${rpcRes.status} ${rpcRes.statusText}`);
      const errTxt = await rpcRes.text();
      console.error(errTxt);
      return;
    }
    
    const slots = await rpcRes.json();
    console.log(`Success! RPC returned ${slots.length} available slots:`);
    if (slots.length > 0) {
      console.log("Sample slots:");
      console.log(JSON.stringify(slots.slice(0, 5), null, 2));
    } else {
      console.log("No slots returned. This could mean:");
      console.log("1. The doctor has no schedule on Wednesday in horarios_doctores (check RLS or trigger sync).");
      console.log("2. RLS on horarios_doctores prevents the RPC from reading the rows (since the RPC is not SECURITY DEFINER).");
      console.log("3. There is an appointment that covers the whole day.");
    }
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

main();
