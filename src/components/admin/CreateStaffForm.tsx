"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { toast } from "@/hooks/useToast";
import { createStaff } from "@/services/staff";
import { createStaffSchema } from "@/types/schemas";

const EMPTY = { name: "", empId: "", email: "", password: "", phone: "" };

export function CreateStaffForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function setField(key: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createStaffSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors;
      const map: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(fieldErrors)) {
        if (msgs?.[0]) map[key] = msgs[0];
      }
      setErrors(map);
      return;
    }
    setErrors({});
    setPending(true);

    const result = await createStaff(parsed.data);
    setPending(false);

    if (result.ok) {
      toast.success("Valet Created", `${parsed.data.name} can now log in`);
      if (result.warning) toast.warning("Note", result.warning);
      setForm(EMPTY);
    } else {
      toast.error("Create Failed", result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Valet Account</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Full Name"
              required
              placeholder="Rahul Kumar"
              value={form.name}
              onChange={setField("name")}
              error={errors.name}
              disabled={pending}
            />
            <Input
              label="Employee ID"
              placeholder="V001"
              value={form.empId}
              onChange={setField("empId")}
              disabled={pending}
            />
          </div>
          <Input
            label="Email"
            required
            type="email"
            placeholder="rahul@hotel.com"
            value={form.email}
            onChange={setField("email")}
            error={errors.email}
            disabled={pending}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Password"
              required
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={setField("password")}
              error={errors.password}
              disabled={pending}
            />
            <Input
              label="Mobile (for shift SMS)"
              type="tel"
              placeholder="10-digit number"
              value={form.phone}
              onChange={setField("phone")}
              disabled={pending}
            />
          </div>
          <Button type="submit" fullWidth loading={pending} className="mt-1">
            {pending ? "Creating…" : "Create Account →"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
