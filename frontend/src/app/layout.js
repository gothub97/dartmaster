"use client";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GameProvider } from "@/contexts/GameContextV2";
import { PracticeProvider } from "@/contexts/PracticeContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Dartmaster - Master Your Dart Game</title>
        <meta name="description" content="Track your dart games, improve your skills, and compete with friends on Dartmaster." />
      </head>
      <body>
        <AuthProvider>
          <UserProfileProvider>
            <GameProvider>
              <PracticeProvider>
                {children}
              </PracticeProvider>
            </GameProvider>
          </UserProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}