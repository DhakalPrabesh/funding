'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getMembers, addMember, updateMember, deleteMember, getDeposits, getWithdrawals, type Member } from '@/lib/storage'
import { formatCurrency } from '@/lib/currency'
import { Plus, Search, Trash2, Eye, Edit, Upload, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    profilePicture: '',
  })

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = () => {
    setMembers(getMembers())
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB.',
          variant: 'destructive',
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    addMember({
      ...formData,
      balance: 0,
      joinedDate: new Date().toISOString(),
    })
    loadMembers()
    setIsAddDialogOpen(false)
    setFormData({ name: '', email: '', phone: '', status: 'active', profilePicture: '' })
    toast({
      title: 'Member added',
      description: 'New member has been successfully added.',
    })
  }

  const handleDeleteMember = (id: string) => {
    if (confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      deleteMember(id)
      loadMembers()
      toast({
        title: 'Member deleted',
        description: 'Member has been successfully removed.',
        variant: 'destructive',
      })
    }
  }

  const handleViewMember = (member: Member) => {
    setSelectedMember(member)
    setIsViewDialogOpen(true)
  }

  const getMemberTransactions = (memberId: string) => {
    const deposits = getDeposits().filter(d => d.memberId === memberId)
    const withdrawals = getWithdrawals().filter(w => w.memberId === memberId)
    return { deposits, withdrawals }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery)
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Enter the member's information below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={formData.profilePicture || "/placeholder.svg"} />
                      <AvatarFallback>
                        <User className="h-8 w-8 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="picture" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md hover:bg-secondary/80 transition-colors w-fit">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Upload Photo</span>
                        </div>
                        <Input
                          id="picture"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max size: 5MB
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Member</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No members found matching your search.' : 'No members yet. Add your first member to get started.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Profile</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Balance</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.profilePicture || "/placeholder.svg"} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{member.name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{member.email}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{member.phone}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-accent">
                            {formatCurrency(member.balance)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                              {member.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewMember(member)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedMember.profilePicture || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">
                      {selectedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedMember.name}</h3>
                    <Badge variant={selectedMember.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                      {selectedMember.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-sm text-foreground">{selectedMember.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="text-sm text-foreground">{selectedMember.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Current Balance</Label>
                    <p className="text-xl font-bold text-accent">{formatCurrency(selectedMember.balance)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Joined Date</Label>
                    <p className="text-sm text-foreground">
                      {new Date(selectedMember.joinedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Transaction History</h3>
                  {(() => {
                    const { deposits, withdrawals } = getMemberTransactions(selectedMember.id)
                    const allTx = [
                      ...deposits.map(d => ({ ...d, type: 'deposit' })),
                      ...withdrawals.map(w => ({ ...w, type: 'withdrawal' })),
                    ].sort((a, b) => {
                      const timeA = 'timestamp' in a ? a.timestamp : new Date(a.requestDate).getTime()
                      const timeB = 'timestamp' in b ? b.timestamp : new Date(b.requestDate).getTime()
                      return timeB - timeA
                    })

                    return allTx.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No transactions yet</p>
                    ) : (
                      <div className="space-y-2">
                        {allTx.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.date || tx.requestDate).toLocaleString()}
                              </p>
                            </div>
                            <p className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-accent' : 'text-destructive'}`}>
                              {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
