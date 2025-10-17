import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [canReset, setCanReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen first, then check existing session to avoid missing the event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || !!session) {
        setCanReset(true);
      }
    });

    // Handle PKCE recovery links like ?code=...
    const search = window.location.search;
    const hasCode = !!search && search.includes("code=");
    if (hasCode) {
      supabase.auth.exchangeCodeForSession(window.location.href)
        .then(({ data, error }) => {
          if (error) {
            console.error("Exchange code error:", error);
            toast({
              title: "Invalid or expired link",
              description: "Please request a new password reset link.",
              variant: "destructive",
            });
            return;
          }
          if (data?.session) {
            setCanReset(true);
          }
        });
    }

    // Also check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCanReset(true);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please re-enter the same password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });

      // Sign out recovery session and send user to login
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Unable to reset password. Try requesting a new link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>
            {canReset ? "Enter and confirm your new password." : "This reset link is invalid or has expired. Request a new link from the login screen."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canReset ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Button className="w-full" onClick={() => navigate("/")}>Back to Login</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
