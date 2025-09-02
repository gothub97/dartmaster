"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl">Dartmaster</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/auth/login" className="text-gray-700 hover:text-gray-900 font-medium">
                Sign In
              </a>
              <a
                href="/auth/register"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center space-x-2 bg-orange-50 rounded-full px-4 py-2 mb-8">
              <span className="text-orange-600 font-semibold">NEW</span>
              <span className="text-gray-700">Real-time match tracking now available</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Your Darts.<br />
              <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                Perfected.
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Dartmaster is your personal darts companion. Track your games, monitor your progress, 
              and analyze your performance to become a better player. Whether you're practicing alone 
              or competing with friends, we help you master your game.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Playing →
              </a>
              <a 
                href="/auth/login"
                className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition"
              >
                Sign In
              </a>
            </div>

            <p className="mt-8 text-sm text-gray-500">
              Create your account and start tracking your darts journey
            </p>
          </div>

          {/* Hero Image/Visual */}
          <div className="mt-20 relative">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl font-bold text-orange-500 mb-2">98.2%</div>
                  <div className="text-gray-600">Accuracy Tracking</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl font-bold text-orange-500 mb-2">47</div>
                  <div className="text-gray-600">Average Improvement</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl font-bold text-orange-500 mb-2">180</div>
                  <div className="text-gray-600">Perfect Scores</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Master Your Game
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade tools designed for players at every level
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Analytics</h3>
              <p className="text-gray-600">
                Track your performance with instant statistics. See your averages, checkout percentages, and hit zones updated live as you play.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Practice Drills</h3>
              <p className="text-gray-600">
                Targeted practice modes for doubles, triples, and checkout scenarios. Build muscle memory with our scientifically designed drills.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Compete & Compare</h3>
              <p className="text-gray-600">
                Join leagues, challenge friends, and climb the global leaderboard. See how you stack up against players worldwide.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Checkout Suggestions</h3>
              <p className="text-gray-600">
                Get real-time checkout path recommendations based on your personal strengths and professional strategies.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Match History</h3>
              <p className="text-gray-600">
                Complete match replays with throw-by-throw analysis. Learn from your games and identify patterns in your play.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance Insights</h3>
              <p className="text-gray-600">
                AI-powered analysis identifies your strengths and weaknesses. Get personalized tips to improve faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Start Improving in Minutes
            </h2>
            <p className="text-xl text-gray-600">
              Getting started with Dartmaster is as easy as 1-2-3
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Account</h3>
              <p className="text-gray-600">
                Sign up in seconds with just your email and start tracking your darts journey.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Playing</h3>
              <p className="text-gray-600">
                Use our virtual dartboard to log your throws. Works on any device, anywhere.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Track & Improve</h3>
              <p className="text-gray-600">
                Watch your stats improve over time with personalized insights and recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Players Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              From pub leagues to professional tournaments
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">10K+</div>
              <div className="text-gray-600">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">2M+</div>
              <div className="text-gray-600">Matches Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">500+</div>
              <div className="text-gray-600">Clubs & Leagues</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">4.9/5</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  ★★★★★
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Dartmaster transformed my game. My average went from 45 to 65 in just 3 months. The analytics are incredible!"
              </p>
              <div className="font-semibold text-gray-900">Sarah M.</div>
              <div className="text-sm text-gray-500">League Player</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  ★★★★★
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The practice drills are game-changing. I finally hit my first 180 after using the app for just 2 weeks!"
              </p>
              <div className="font-semibold text-gray-900">Mike T.</div>
              <div className="text-sm text-gray-500">Pub Player</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  ★★★★★
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Our entire club uses Dartmaster now. The league features and live match tracking are fantastic."
              </p>
              <div className="font-semibold text-gray-900">James K.</div>
              <div className="text-sm text-gray-500">Club Captain</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Take Your Game to the Next Level?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of players already improving with Dartmaster. 
            Track your games, analyze your stats, and become a better player.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/register"
              className="bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 transition shadow-lg hover:shadow-xl"
            >
              Join Dartmaster →
            </a>
            <a 
              href="/auth/login"
              className="bg-transparent text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-700 hover:border-gray-600 transition"
            >
              Sign In
            </a>
          </div>
          <p className="mt-8 text-gray-400">
            Start tracking • Improve your game • Connect with players
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Dartmaster</h4>
              <ul className="space-y-2">
                <li><a href="/auth/register" className="text-gray-600 hover:text-gray-900">Get Started</a></li>
                <li><a href="/auth/login" className="text-gray-600 hover:text-gray-900">Sign In</a></li>
                <li><a href="/players" className="text-gray-600 hover:text-gray-900">Players</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Community</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Discord</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Forum</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Events</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Help</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">FAQ</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-600 hover:text-gray-900">Terms of Service</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>© 2024 Dartmaster - Made with 🎯 by dart enthusiasts</p>
          </div>
        </div>
      </footer>
    </div>
  );
}