// pages/api/admin/create-user.ts
import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // deve estar no .env do servidor

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  const { email, password, name } = req.body;

  if (!email || !password) return res.status(400).json({ message: "email and password required" });

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) {
      console.error("Supabase admin.createUser error:", error);
      return res.status(500).json({ message: error.message });
    }

    const uid = data.user?.id;
    if (!uid) return res.status(500).json({ message: "No uid returned" });

    // Optionally: insert into employees from server here using supabaseAdmin (service role)
    // const { error: insertError } = await supabaseAdmin.from('employees').insert({ id: uid, name, email, ... });

    return res.status(200).json({ uid });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal error" });
  }
}
