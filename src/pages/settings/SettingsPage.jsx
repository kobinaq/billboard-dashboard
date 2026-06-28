import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card } from "components/ui/Card";
import { Table } from "components/ui/Table";
import { SetupNotice } from "components/shared/SetupNotice";
import { useAsyncResource } from "hooks/useAsyncResource";
import { requireSupabase } from "lib/supabase";
import { deactivateManagedUser, upsertManagedUser } from "lib/admin";
import { Badge } from "components/ui/Badge";
import { Button } from "components/ui/Button";
import { Modal } from "components/ui/Modal";
import { Input } from "components/ui/Input";
import { Select } from "components/ui/Select";
import { Textarea } from "components/ui/Textarea";
import { FormActions } from "components/ui/FormActions";
import { ROLES } from "lib/constants";
import { formatDate, getErrorMessage } from "lib/utils";

async function loadSettingsData() {
  const client = requireSupabase();
  const [
    { data: profiles, error: profilesError },
    { data: regions, error: regionsError },
    { data: types, error: typesError },
    { data: clients, error: clientsError }
  ] = await Promise.all([
    client
      .from("profiles")
      .select(
        "id, full_name, email, phone, role, company_name, is_active, deactivated_at, deactivation_reason, created_at"
      )
      .order("created_at", { ascending: false }),
    client.from("regions").select("*").order("name"),
    client.from("billboard_types").select("*").order("name"),
    client
      .from("clients")
      .select("id, company_name, contact_name, contact_email, contact_phone, profile_id")
      .order("company_name")
  ]);

  if (profilesError || regionsError || typesError || clientsError) {
    throw profilesError || regionsError || typesError || clientsError;
  }

  return { profiles, regions, types, clients };
}

const userSchema = z
  .object({
    mode: z.enum(["create", "update"]),
    userId: z.string().optional(),
    fullName: z.string().min(2, "Enter a full name."),
    email: z.string().email("Enter a valid email."),
    phone: z.string().optional(),
    role: z.string().min(1, "Choose a role."),
    clientId: z.string().optional(),
    companyName: z.string().optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    industry: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional()
  })
  .superRefine((values, context) => {
    if (values.role === "client" && !values.clientId && !values.companyName?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Client users need a linked client or company name."
      });
    }
  });

const lookupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Enter a name.")
});

async function saveLookup(table, values) {
  const client = requireSupabase();
  const payload = { name: values.name.trim() };
  const query = values.id
    ? client.from(table).update(payload).eq("id", values.id)
    : client.from(table).insert(payload);
  const { data, error } = await query.select().single();
  if (error) {
    throw error;
  }
  return data;
}

async function deleteLookup(table, id) {
  const client = requireSupabase();
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) {
    throw error;
  }
}

export default function SettingsPage() {
  const { data, loading, error, refresh } = useAsyncResource(loadSettingsData);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLookup, setSelectedLookup] = useState(null);
  const [lookupTable, setLookupTable] = useState("regions");
  const [submitting, setSubmitting] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");

  const activeProfiles = useMemo(
    () => (data?.profiles || []).filter((profile) => profile.is_active),
    [data]
  );
  const inactiveProfiles = useMemo(
    () => (data?.profiles || []).filter((profile) => !profile.is_active),
    [data]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      mode: "create",
      userId: "",
      fullName: "",
      email: "",
      phone: "",
      role: "sales",
      clientId: "",
      companyName: "",
      contactName: "",
      contactPhone: "",
      industry: "",
      address: "",
      notes: ""
    }
  });

  const {
    register: registerLookup,
    handleSubmit: handleLookupSubmit,
    reset: resetLookup,
    formState: { errors: lookupErrors }
  } = useForm({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      id: "",
      name: ""
    }
  });

  const selectedClientId = watch("clientId");
  const selectedRole = watch("role");
  const selectedClient = (data?.clients || []).find((client) => client.id === selectedClientId);

  useEffect(() => {
    if (selectedRole === "client" && selectedClient) {
      setValue("companyName", selectedClient.company_name || "");
      setValue("contactName", selectedClient.contact_name || "");
      setValue("contactPhone", selectedClient.contact_phone || "");
    }
  }, [selectedClient, selectedRole, setValue]);

  function openCreateModal() {
    setSelectedUser(null);
    reset({
      mode: "create",
      userId: "",
      fullName: "",
      email: "",
      phone: "",
      role: "sales",
      clientId: "",
      companyName: "",
      contactName: "",
      contactPhone: "",
      industry: "",
      address: "",
      notes: ""
    });
    setUserModalOpen(true);
  }

  function openEditModal(user) {
    const linkedClient = (data?.clients || []).find((client) => client.profile_id === user.id);
    setSelectedUser(user);
    reset({
      mode: "update",
      userId: user.id,
      fullName: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "sales",
      clientId: linkedClient?.id || "",
      companyName: user.company_name || linkedClient?.company_name || "",
      contactName: linkedClient?.contact_name || user.full_name || "",
      contactPhone: linkedClient?.contact_phone || user.phone || "",
      industry: "",
      address: "",
      notes: ""
    });
    setUserModalOpen(true);
  }

  function openDeactivateModal(user) {
    setSelectedUser(user);
    setDeactivateReason("");
    setDeactivateModalOpen(true);
  }

  function openLookupModal(table, entry = null) {
    setLookupTable(table);
    setSelectedLookup(entry);
    resetLookup({
      id: entry?.id || "",
      name: entry?.name || ""
    });
    setLookupModalOpen(true);
  }

  async function onSubmitUser(values) {
    setSubmitting(true);
    try {
      const result = await upsertManagedUser({
        ...values,
        clientId: values.clientId || undefined,
        companyName: values.companyName || selectedClient?.company_name || undefined,
        contactName: values.contactName || selectedClient?.contact_name || undefined,
        contactPhone: values.contactPhone || selectedClient?.contact_phone || undefined
      });
      toast.success(result.message || "User saved.");
      setUserModalOpen(false);
      setSelectedUser(null);
      await refresh();
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeactivate() {
    if (!selectedUser) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await deactivateManagedUser({
        userId: selectedUser.id,
        reason: deactivateReason
      });
      toast.success(result.message || "User deactivated.");
      setDeactivateModalOpen(false);
      setSelectedUser(null);
      await refresh();
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitLookup(values) {
    setSubmitting(true);
    try {
      await saveLookup(lookupTable, values);
      toast.success(selectedLookup ? "Lookup updated." : "Lookup created.");
      setLookupModalOpen(false);
      setSelectedLookup(null);
      await refresh();
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteLookup(table, entry) {
    try {
      await deleteLookup(table, entry.id);
      toast.success("Lookup deleted.");
      await refresh();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
    }
  }

  const userColumns = [
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          className={
            row.is_active
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
              : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
          }
        >
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          {row.is_active ? (
            <Button variant="danger" onClick={() => openDeactivateModal(row)}>
              Deactivate
            </Button>
          ) : null}
        </div>
      )
    }
  ];

  const lookupColumns = (table) => [
    { key: "name", header: table === "regions" ? "Region" : "Type" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => openLookupModal(table, row)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => handleDeleteLookup(table, row)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <SetupNotice />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-semibold">Users</h4>
            <Button onClick={openCreateModal}>Create user</Button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading users...</p>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : (
            <Table columns={userColumns} rows={activeProfiles} onSort={() => {}} />
          )}
        </Card>

        <Card className="space-y-4">
          <h4 className="text-lg font-semibold">Lifecycle summary</h4>
          <div className="space-y-3 text-sm text-slate-600">
            <p>{activeProfiles.length} active users</p>
            <p>{inactiveProfiles.length} inactive users</p>
            <p>Client invites reuse or link existing accounts by email when possible.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h4 className="mb-4 text-lg font-semibold">Inactive users</h4>
          <Table
            columns={[
              { key: "full_name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "role", header: "Role" },
              {
                key: "deactivated_at",
                header: "Deactivated",
                render: (row) => formatDate(row.deactivated_at)
              }
            ]}
            rows={inactiveProfiles}
            onSort={() => {}}
            emptyMessage="No inactive users."
          />
        </Card>

        <Card className="space-y-4">
          <h4 className="text-lg font-semibold">Admin notes</h4>
          <p className="text-sm text-slate-500">
            Inactive users are blocked after the next profile check even if they still have a valid auth session.
          </p>
          <p className="text-sm text-slate-500">
            Regions and billboard types are now managed directly from this screen.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Regions</h4>
            <Button variant="secondary" onClick={() => openLookupModal("regions")}>
              Add region
            </Button>
          </div>
          <Table columns={lookupColumns("regions")} rows={data?.regions || []} onSort={() => {}} />
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Billboard Types</h4>
            <Button variant="secondary" onClick={() => openLookupModal("billboard_types")}>
              Add type
            </Button>
          </div>
          <Table columns={lookupColumns("billboard_types")} rows={data?.types || []} onSort={() => {}} />
        </Card>
      </div>

      <Modal
        open={userModalOpen}
        title={selectedUser ? "Edit user" : "Create user"}
        onClose={() => setUserModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmitUser)}>
          <input type="hidden" {...register("mode")} />
          <input type="hidden" {...register("userId")} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
            <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
            <Input label="Phone" {...register("phone")} />
            <Select label="Role" options={ROLES} error={errors.role?.message} {...register("role")} />
            {selectedRole === "client" ? (
              <>
                <Select
                  label="Link existing client"
                  options={(data?.clients || []).map((client) => ({
                    value: client.id,
                    label: `${client.company_name} - ${client.contact_email}`
                  }))}
                  {...register("clientId")}
                />
                <Input
                  label="Company name"
                  error={errors.companyName?.message}
                  {...register("companyName")}
                />
                <Input label="Client contact name" {...register("contactName")} />
                <Input label="Client contact phone" {...register("contactPhone")} />
              </>
            ) : null}
            <div className="md:col-span-2">
              <Textarea label="Notes" placeholder="Optional admin note." {...register("notes")} />
            </div>
          </div>
          <FormActions submitting={submitting} onCancel={() => setUserModalOpen(false)} />
        </form>
      </Modal>

      <Modal
        open={lookupModalOpen}
        title={selectedLookup ? "Edit lookup value" : "Add lookup value"}
        onClose={() => setLookupModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleLookupSubmit(onSubmitLookup)}>
          <input type="hidden" {...registerLookup("id")} />
          <Input label="Name" error={lookupErrors.name?.message} {...registerLookup("name")} />
          <FormActions submitting={submitting} onCancel={() => setLookupModalOpen(false)} />
        </form>
      </Modal>

      <Modal
        open={deactivateModalOpen}
        title="Deactivate user"
        onClose={() => setDeactivateModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            This keeps the user's history intact and blocks them on the next profile check.
          </p>
          <Textarea
            label="Reason"
            value={deactivateReason}
            onChange={(event) => setDeactivateReason(event.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeactivateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeactivate} disabled={submitting}>
              {submitting ? "Deactivating..." : "Deactivate user"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
