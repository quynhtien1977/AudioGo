// useAuth.js — delegate sang AuthContext (shared singleton state)
// Tất cả component gọi useAuth() sẽ dùng cùng 1 state instance,
// đảm bảo setUser() sau login được phản ánh ngay cho toàn bộ app
// (bao gồm SubscriptionContext.useEffect([user?.accountId, user?.role]))
import { useAuthContext } from "@/context/AuthContext";

export default function useAuth() {
  return useAuthContext();
}