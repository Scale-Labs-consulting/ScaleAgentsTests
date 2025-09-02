'use client'

import { useState, useEffect } from 'react'
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
  HelpCircle,
  Save,
  Check
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const [workspaceName, setWorkspaceName] = useState('Angelo\'s Lovable')
  const [workspaceDescription, setWorkspaceDescription] = useState('')
  
  // Profile form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileUpdated, setProfileUpdated] = useState(false)

  // Initialize form with current user metadata
  useEffect(() => {
    if (user?.user_metadata) {
      setFirstName(user.user_metadata.first_name || '')
      setLastName(user.user_metadata.last_name || '')
    }
  }, [user])

  const handleClose = () => {
    router.push('/dashboard')
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    
    setIsUpdatingProfile(true)
    setProfileUpdated(false)
    
    try {
      // Update user metadata instead of profile
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`
        }
      })
      
      if (error) throw error
      
      setProfileUpdated(true)
      
      // Reset the success state after 3 seconds
      setTimeout(() => setProfileUpdated(false), 3000)
    } catch (error) {
      console.error('Failed to update user metadata:', error)
    } finally {
      setIsUpdatingProfile(false)
    }
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
                  <span className="text-white/80">
                    {user?.user_metadata?.full_name || 
                     (user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                       ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                       : user?.user_metadata?.first_name || user?.email || 'User'
                     )}
                  </span>
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
                <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
                <p className="text-white/70">Manage your account and workspace settings.</p>
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
              {/* Profile Information */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Profile Information</h3>
                      <p className="text-white/70 text-sm">Update your personal information that will be displayed throughout the application.</p>
                    </div>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-xl">
                          {user?.user_metadata?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">First Name</label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter your first name"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Last Name</label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Enter your last name"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="bg-white/5 border-white/20 text-white/50 cursor-not-allowed"
                      />
                      <p className="text-xs text-white/50 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-2">
                        {profileUpdated && (
                          <div className="flex items-center space-x-2 text-green-400">
                            <Check className="w-4 h-4" />
                            <span className="text-sm">Profile updated successfully!</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile}
                        className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                      >
                        {isUpdatingProfile ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
