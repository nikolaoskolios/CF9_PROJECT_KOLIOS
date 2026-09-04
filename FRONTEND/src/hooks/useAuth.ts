import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import {
  AuthService,
  type Body_login_for_access_token_auth_token_post as AccessToken,
  type CreateUserRequest,
  UserService,
} from "@/client"
import { handleError } from "@/utils"
import useCustomToast from "./useCustomToast"

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: UserService.getUserUserGet,
    enabled: isLoggedIn(),
  })

  const login = async (data: AccessToken) => {
    const response = await AuthService.loginForAccessTokenAuthTokenPost({
      formData: data,
    })
    localStorage.setItem("access_token", response.access_token)
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/" })
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })

  const logout = () => {
    localStorage.removeItem("access_token")
    navigate({ to: "/login" })
  }

  const signUpMutation = useMutation({
    mutationFn: (data: CreateUserRequest) =>
      AuthService.createUserAuthPost({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Account created - log in to continue")
      navigate({ to: "/login" })
    },
    onError: handleError.bind(showErrorToast),
  })

  return {
    loginMutation,
    signUpMutation,
    logout,
    user,
  }
}

export { isLoggedIn }
export default useAuth
