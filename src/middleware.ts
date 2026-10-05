export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/tasks/:path*", "/settings/:path*"]
};
