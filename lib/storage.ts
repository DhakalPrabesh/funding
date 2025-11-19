// LocalStorage utility for persistent data storage
export interface Member {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  balance: number
  joinedDate: string
  profilePicture?: string // Base64 encoded image or URL
}

export interface Deposit {
  id: string
  memberId: string
  memberName: string
  amount: number
  depositorInfo: string
  date: string
  timestamp: number
}

export interface Withdrawal {
  id: string
  memberId: string
  memberName: string
  amount: number
  status: 'pending' | 'approved' | 'denied'
  requestDate: string
  processedDate?: string
  reason?: string
}

export interface User {
  username: string
  role: 'admin' | 'staff' | 'member'
}

const STORAGE_KEYS = {
  MEMBERS: 'fund_management_members',
  DEPOSITS: 'fund_management_deposits',
  WITHDRAWALS: 'fund_management_withdrawals',
  USER: 'fund_management_user',
  SETTINGS: 'fund_management_settings',
}

// Members
export const getMembers = (): Member[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.MEMBERS)
  return data ? JSON.parse(data) : []
}

export const saveMembers = (members: Member[]) => {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members))
}

export const addMember = (member: Omit<Member, 'id'>) => {
  const members = getMembers()
  const newMember = { ...member, id: Date.now().toString() }
  members.push(newMember)
  saveMembers(members)
  return newMember
}

export const updateMember = (id: string, updates: Partial<Member>) => {
  const members = getMembers()
  const index = members.findIndex(m => m.id === id)
  if (index !== -1) {
    members[index] = { ...members[index], ...updates }
    saveMembers(members)
  }
}

export const deleteMember = (id: string) => {
  const members = getMembers().filter(m => m.id !== id)
  saveMembers(members)
}

// Deposits
export const getDeposits = (): Deposit[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.DEPOSITS)
  return data ? JSON.parse(data) : []
}

export const saveDeposits = (deposits: Deposit[]) => {
  localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits))
}

export const addDeposit = (deposit: Omit<Deposit, 'id' | 'timestamp'>) => {
  const deposits = getDeposits()
  const newDeposit = {
    ...deposit,
    id: Date.now().toString(),
    timestamp: Date.now(),
  }
  deposits.push(newDeposit)
  saveDeposits(deposits)
  
  // Update member balance
  const members = getMembers()
  const member = members.find(m => m.id === deposit.memberId)
  if (member) {
    member.balance += deposit.amount
    saveMembers(members)
  }
  
  return newDeposit
}

export const deleteDeposit = (id: string) => {
  const deposits = getDeposits()
  const deposit = deposits.find(d => d.id === id)
  
  if (deposit) {
    // Revert member balance
    const members = getMembers()
    const member = members.find(m => m.id === deposit.memberId)
    if (member) {
      member.balance -= deposit.amount
      saveMembers(members)
    }
  }
  
  const filtered = deposits.filter(d => d.id !== id)
  saveDeposits(filtered)
}

// Withdrawals
export const getWithdrawals = (): Withdrawal[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS)
  return data ? JSON.parse(data) : []
}

export const saveWithdrawals = (withdrawals: Withdrawal[]) => {
  localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals))
}

export const addWithdrawal = (withdrawal: Omit<Withdrawal, 'id'>) => {
  const withdrawals = getWithdrawals()
  const newWithdrawal = { ...withdrawal, id: Date.now().toString() }
  withdrawals.push(newWithdrawal)
  saveWithdrawals(withdrawals)
  return newWithdrawal
}

export const updateWithdrawal = (id: string, updates: Partial<Withdrawal>) => {
  const withdrawals = getWithdrawals()
  const index = withdrawals.findIndex(w => w.id === id)
  
  if (index !== -1) {
    const oldStatus = withdrawals[index].status
    withdrawals[index] = { ...withdrawals[index], ...updates }
    
    // If withdrawal is approved, deduct from member balance
    if (oldStatus !== 'approved' && updates.status === 'approved') {
      const withdrawal = withdrawals[index]
      const members = getMembers()
      const member = members.find(m => m.id === withdrawal.memberId)
      if (member && member.balance >= withdrawal.amount) {
        member.balance -= withdrawal.amount
        saveMembers(members)
      }
    }
    
    saveWithdrawals(withdrawals)
  }
}

export const deleteWithdrawal = (id: string) => {
  const withdrawals = getWithdrawals().filter(w => w.id !== id)
  saveWithdrawals(withdrawals)
}

// User Authentication
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(STORAGE_KEYS.USER)
  return data ? JSON.parse(data) : null
}

export const login = (username: string, password: string): User | null => {
  // Simple authentication - in production, this would be handled by a backend
  if (username === 'admin' && password === 'admin123') {
    const user: User = { username: 'admin', role: 'admin' }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))

    // Notify listeners that auth state has changed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'))
    }

    return user
  }
  return null
}

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.USER)

  // Notify listeners that auth state has changed
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'))
  }
}

// Settings
export const getSettings = () => {
  if (typeof window === 'undefined') return { withdrawalLimit: 10000 }
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
  return data ? JSON.parse(data) : { withdrawalLimit: 10000 }
}

export const saveSettings = (settings: any) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
}
