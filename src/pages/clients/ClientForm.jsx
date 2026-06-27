import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card } from "components/ui/Card";
import { FormActions } from "components/ui/FormActions";
import { Input } from "components/ui/Input";
import { Textarea } from "components/ui/Textarea";
import { PageHeader } from "components/shared/PageHeader";
import { useClients } from "hooks/useClients";
import { getErrorMessage } from "lib/utils";
import { Button } from "components/ui/Button";
import { Modal } from "components/ui/Modal";
import { useAuth } from "context/AuthContext";
import { upsertManagedUser } from "lib/admin";

const schema = z.object({
  company_name: z.string().min(2),
  contact_name: z.string().min(2),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

const portalSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  companyName: z.string().min(2)
});

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useAuth();
  const { data, saveClient, refresh } = useClients();
  const current = useMemo(() => (data || []).find((item) => item.id === id), [data, id]);
  const [submitting, setSubmitting] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [portalSubmitting, setPortalSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      company_name: current?.company_name || "",
      contact_name: current?.contact_name || "",
      contact_email: current?.contact_email || "",
      contact_phone: current?.contact_phone || "",
      industry: current?.industry || "",
      address: current?.address || "",
      notes: current?.notes || ""
    }
  });
  const {
    register: registerPortal,
    handleSubmit: handleSubmitPortal,
    formState: { errors: portalErrors },
    reset: resetPortal
  } = useForm({
    resolver: zodResolver(portalSchema),
    values: {
      fullName: current?.contact_name || "",
      email: current?.contact_email || "",
      phone: current?.contact_phone || "",
      companyName: current?.company_name || ""
    }
  });

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await saveClient(values, id);
      toast.success(id ? "Client updated." : "Client created.");
      navigate("/clients");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function openPortalModal() {
    resetPortal({
      fullName: current?.contact_name || "",
      email: current?.contact_email || "",
      phone: current?.contact_phone || "",
      companyName: current?.company_name || ""
    });
    setPortalModalOpen(true);
  }

  async function onSubmitPortal(values) {
    if (!current?.id) {
      toast.error("Save the client first before inviting portal access.");
      return;
    }

    setPortalSubmitting(true);
    try {
      const result = await upsertManagedUser({
        mode: current.profile_id ? "update" : "create",
        userId: current.profile_id || undefined,
        role: "client",
        clientId: current.id,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        companyName: values.companyName,
        contactName: values.fullName,
        contactPhone: values.phone
      });
      toast.success(result.message || "Portal access sent.");
      setPortalModalOpen(false);
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPortalSubmitting(false);
    }
  }

  const linkedProfile = current?.profiles;
  const canManagePortal = role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? "Edit Client" : "Add Client"}
        description="Keep contact details, notes, and client-facing setup aligned."
      />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card className="grid gap-4 md:grid-cols-2">
          <Input label="Company name" error={errors.company_name?.message} {...register("company_name")} />
          <Input label="Contact name" error={errors.contact_name?.message} {...register("contact_name")} />
          <Input label="Contact email" type="email" error={errors.contact_email?.message} {...register("contact_email")} />
          <Input label="Contact phone" {...register("contact_phone")} />
          <Input label="Industry" {...register("industry")} />
          <Input label="Address" {...register("address")} />
          <div className="md:col-span-2">
            <Textarea label="Notes" {...register("notes")} />
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold">Portal access</h4>
              <p className="text-sm text-slate-500">
                Invite a client user by email or link an existing account to this client record through the admin Edge Function workflow.
              </p>
            </div>
            {canManagePortal && current?.id ? (
              <Button type="button" onClick={openPortalModal}>
                {current.profile_id ? "Update portal user" : "Invite portal user"}
              </Button>
            ) : null}
          </div>

          {!current?.id ? (
            <p className="text-sm text-slate-500">
              Save the client first, then invite or link portal access.
            </p>
          ) : linkedProfile ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Linked user: {linkedProfile.full_name} ({linkedProfile.email}) •{" "}
              {linkedProfile.is_active ? "Active" : "Inactive"}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No portal account linked yet.
            </p>
          )}

          {!canManagePortal ? (
            <p className="text-sm text-amber-700">
              Only admins can manage portal access because this workflow uses privileged Edge Functions.
            </p>
          ) : null}
        </Card>
        <FormActions submitting={submitting} onCancel={() => navigate("/clients")} />
      </form>

      <Modal
        open={portalModalOpen}
        title={current?.profile_id ? "Update portal user" : "Invite portal user"}
        onClose={() => setPortalModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmitPortal(onSubmitPortal)}>
          <Input label="Full name" error={portalErrors.fullName?.message} {...registerPortal("fullName")} />
          <Input label="Email" type="email" error={portalErrors.email?.message} {...registerPortal("email")} />
          <Input label="Phone" {...registerPortal("phone")} />
          <Input
            label="Company name"
            error={portalErrors.companyName?.message}
            {...registerPortal("companyName")}
          />
          <FormActions
            submitting={portalSubmitting}
            onCancel={() => setPortalModalOpen(false)}
          />
        </form>
      </Modal>
    </div>
  );
}
