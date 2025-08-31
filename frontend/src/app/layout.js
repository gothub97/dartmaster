"use client";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GameProvider } from "@/contexts/GameContextV2";
import { PracticeProvider } from "@/contexts/PracticeContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { FriendsProvider } from "@/contexts/FriendsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Dartmaster - Master Your Dart Game</title>
        <meta name="description" content="Track your dart games, improve your skills, and compete with friends on Dartmaster." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body>
        <AuthProvider>
          <UserProfileProvider>
            <FriendsProvider>
              <NotificationProvider>
                <GameProvider>
                  <PracticeProvider>
                    {children}
                  </PracticeProvider>
                </GameProvider>
              </NotificationProvider>
            </FriendsProvider>
          </UserProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}