import useAuth from "@/hooks/useAuth"

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="py-1 truncate max-w-sm">{value || "N/A"}</p>
    </div>
  )
}

const UserInformation = () => {
  const { user: currentUser } = useAuth()

  if (!currentUser) {
    return null
  }

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold py-4">User Information</h3>
      <div className="flex flex-col gap-4">
        <Field label="Username" value={currentUser.username} />
        <Field label="Email" value={currentUser.email} />
        <Field
          label="Full name"
          value={`${currentUser.first_name} ${currentUser.last_name}`.trim()}
        />
        <Field label="Phone number" value={currentUser.phone_number} />
        <Field label="Role" value={currentUser.role} />
      </div>
    </div>
  )
}

export default UserInformation
