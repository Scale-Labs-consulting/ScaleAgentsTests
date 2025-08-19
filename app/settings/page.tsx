'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Users, 
  CreditCard, 
  User, 
  Beaker, 
  Edit3,
  HelpCircle
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [workspaceName, setWorkspaceName] = useState('Angelo\'s Lovable')
  const [workspaceDescription, setWorkspaceDescription] = useState('')

  const handleClose = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/brand-background.png"
          alt="Background"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/20 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-900/95 border-r border-white/10 backdrop-blur-sm">
          <div className="p-6">
            {/* Workspace Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-white/60 mb-4">Workspace</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">A</span>
                  </div>
                  <span className="text-white font-medium">Angelo's Lovable</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                  <Users className="w-5 h-5 text-white/60" />
                  <span className="text-white/80">People</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                  <CreditCard className="w-5 h-5 text-white/60" />
                  <span className="text-white/80">Plans & Billing</span>
                </div>
              </div>
            </div>

                         {/* Account Section */}
             <div>
               <h3 className="text-sm font-semibold text-white/60 mb-4">Account</h3>
               <div className="space-y-2">
                 <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                   <User className="w-5 h-5 text-white/60" />
                   <span className="text-white/80">Angelo Cardoso</span>
                 </div>
                 <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                   <Beaker className="w-5 h-5 text-white/60" />
                   <span className="text-white/80">Labs</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Workspace Settings</h1>
                <p className="text-white/70">Workspaces allow you to collaborate on projects in real time.</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 bg-white/5">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Docs
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/20 text-white hover:bg-white/10 bg-white/5"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-8">
              {/* Workspace Avatar */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Workspace Avatar</h3>
                      <p className="text-white/70 text-sm">Set an avatar for your workspace.</p>
                    </div>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-xl">A</span>
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded flex items-center justify-center">
                        <Edit3 className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workspace Name */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Workspace Name</h3>
                      <p className="text-white/70 text-sm">Your full workspace name, as visible to others.</p>
                    </div>
                    <div className="w-80">
                      <Input
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workspace Description */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Workspace Description</h3>
                      <p className="text-white/70 text-sm">A short description about your workspace or team.</p>
                    </div>
                    <div className="w-80">
                      <Textarea
                        value={workspaceDescription}
                        onChange={(e) => setWorkspaceDescription(e.target.value)}
                        placeholder="Description"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500 resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
