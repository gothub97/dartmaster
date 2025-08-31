"use client";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GameProvider } from "@/contexts/GameContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Dartmaster - Master Your Dart Game</title>
        <meta name="description" content="Track your dart games, improve your skills, and compete with friends on Dartmaster." />
      </head>
      <body>
        <AuthProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}