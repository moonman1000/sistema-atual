import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      password,
      name,
      role,
      phone,
      salary,
      hire_date,
      restaurant_id,
    } = await req.json();

    if (!email || !password || !name || !restaurant_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, password, name, restaurant_id",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      console.error("Supabase create user error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const uid = authData.user?.id;
    if (!uid) {
      return new Response(
        JSON.stringify({ error: "No uid returned from auth" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const { error: dbError } = await supabaseAdmin.from("employees").insert({
      id: uid,
      name,
      email,
      phone,
      role,
      status: "Ativo",
      salary: parseFloat(salary) || 0,
      hire_date: hire_date || new Date().toISOString().split("T")[0],
      restaurant_id,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      try {
        await supabaseAdmin.auth.admin.deleteUser(uid);
      } catch (delErr) {
        console.error("Failed to rollback created auth user:", delErr);
      }
      return new Response(
        JSON.stringify({ error: dbError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, uid, message: "User and employee created" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Internal error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
