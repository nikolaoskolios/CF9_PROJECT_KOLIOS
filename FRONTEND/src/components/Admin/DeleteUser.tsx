import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { useState } from "react"

import { AdminService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const DeleteUser = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { user: currentUser } = useAuth()

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => AdminService.readAllUsersAdminUserGet(),
  })

  // Admins can't delete their own account (enforced server-side too), so
  // don't even offer it as an option here.
  const otherUsers = (users ?? []).filter((u) => u.id !== currentUser?.id)
  const selectedUser = otherUsers.find((u) => u.id === Number(selectedUserId))

  const mutation = useMutation({
    mutationFn: (userId: number) =>
      AdminService.deleteUserAdminUserUserIdDelete({ userId }),
    onSuccess: () => {
      showSuccessToast("User account deleted successfully")
      setSelectedUserId("")
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    },
  })

  const onDelete = () => {
    if (!selectedUser) return
    mutation.mutate(selectedUser.id)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) setSelectedUserId("")
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" className="my-4">
          <Trash2 className="mr-2 size-4" />
          Delete User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Choose a user account to permanently delete. You will not be able
            to undo this action.
          </DialogDescription>
        </DialogHeader>

        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {otherUsers.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.username} ({u.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={mutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <LoadingButton
            variant="destructive"
            onClick={onDelete}
            loading={mutation.isPending}
            disabled={!selectedUser}
          >
            Delete User
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteUser
