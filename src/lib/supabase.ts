import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Use the actual Supabase project details
const supabaseUrl = 'https://jxsxbtiasjujksyzrxdn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c3hidGlhc2p1amtzeXpyeGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNTcxMzYsImV4cCI6MjA2NTkzMzEzNn0.7tiXBddCW_1mIcLz03OFQr3apNRxGG0nnc-r1YQX6FE'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper functions for common operations
export const supabaseHelpers = {
  // Auth helpers
  async signUp(email: string, password: string, metadata?: any) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  async signOut() {
    return await supabase.auth.signOut()
  },

  async getCurrentUser() {
    return await supabase.auth.getUser()
  },

  async getSession() {
    return await supabase.auth.getSession()
  },

  // Profile helpers
  async getProfile(userId: string) {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  },

  async updateProfile(userId: string, updates: any) {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
  },

  // Opportunity helpers
  async getOpportunities(country?: string) {
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (country) {
      query = query.eq('country', country)
    }

    return await query
  },

  async createOpportunity(opportunity: any) {
    return await supabase
      .from('opportunities')
      .insert(opportunity)
      .select()
      .single()
  },

  async updateOpportunity(id: string, updates: any) {
    return await supabase
      .from('opportunities')
      .update(updates)
      .eq('id', id)
  },

  // Service provider helpers
  async getServiceProviders(country?: string) {
    let query = supabase
      .from('service_providers')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })

    if (country) {
      query = query.eq('country', country)
    }

    return await query
  },

  async createServiceProvider(provider: any) {
    return await supabase
      .from('service_providers')
      .insert(provider)
      .select()
      .single()
  },

  // Token helpers
  async getTokenTransactions(userId: string) {
    return await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },

  async createTokenTransaction(transaction: any) {
    return await supabase
      .from('token_transactions')
      .insert(transaction)
  },

  // Payment voucher helpers
  async createPaymentVoucher(voucher: any) {
    return await supabase
      .from('payment_vouchers')
      .insert(voucher)
      .select()
      .single()
  },

  async updatePaymentVoucher(id: string, updates: any) {
    return await supabase
      .from('payment_vouchers')
      .update(updates)
      .eq('id', id)
  },

  // Escrow helpers
  async getEscrowAccounts(country?: string) {
    let query = supabase
      .from('escrow_accounts')
      .select('*')
      .eq('is_active', true)

    if (country) {
      query = query.eq('country', country)
    }

    return await query
  },

  // Chat helpers (for future implementation)
  async getChatMessages(chatId: string) {
    // This would be implemented when chat table is added
    return { data: [], error: null }
  },

  async sendChatMessage(message: any) {
    // This would be implemented when chat table is added
    return { data: null, error: null }
  },

  // Admin helpers
  async getAllUsers() {
    return await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
  },

  async updateUserRole(userId: string, role: string) {
    return await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
  },

  async getAllPaymentVouchers() {
    return await supabase
      .from('payment_vouchers')
      .select('*')
      .order('created_at', { ascending: false })
  }
}

// Realtime subscriptions
export const realtimeSubscriptions = {
  // Chat messages subscription
  subscribeToChat(chatId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`
      }, callback)
      .subscribe()
  },

  // Opportunity updates subscription
  subscribeToOpportunities(callback: (payload: any) => void) {
    return supabase
      .channel('opportunities')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'opportunities'
      }, callback)
      .subscribe()
  },

  // Payment voucher updates subscription
  subscribeToPaymentVouchers(callback: (payload: any) => void) {
    return supabase
      .channel('payment_vouchers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payment_vouchers'
      }, callback)
      .subscribe()
  }
}
