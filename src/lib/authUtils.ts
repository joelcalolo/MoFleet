// Utilitários para autenticação de usuários da empresa
import { supabase } from "@/integrations/supabase/client";

// Função para fazer hash da senha (usando Web Crypto API)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Função para verificar senha
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Interface para usuário da empresa
export interface CompanyUser {
  id: string;
  company_id: string;
  username: string;
  role: 'gerente' | 'tecnico';
  is_active: boolean;
}

// Função para gerar subdomain a partir do nome da empresa
export function generateSubdomain(companyName: string): string {
  return companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]/g, "-") // Substitui caracteres especiais por hífen
    .replace(/-+/g, "-") // Remove hífens duplicados
    .replace(/^-|-$/g, "") // Remove hífens do início/fim
    .substring(0, 50); // Limita tamanho
}

// Função para obter subdomain da URL atual
export function getSubdomainFromHost(): string | null {
  const hostname = window.location.hostname;
  
  // Se for localhost, retornar null (modo desenvolvimento)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost:')) {
    return null;
  }
  
  // Extrair subdomain (primeira parte antes do primeiro ponto)
  const parts = hostname.split('.');
  
  // Se tiver mais de 2 partes (ex: empresa.mofleet.com), a primeira é o subdomain
  if (parts.length >= 3) {
    const subdomain = parts[0];
    
    // Se o subdomain for "www", retornar null (deve usar login de proprietário)
    if (subdomain.toLowerCase() === 'www') {
      return null;
    }
    
    return subdomain;
  }
  
  // Se não tiver subdomain (ex: mofleet.com), retornar null (login de proprietário)
  return null;
}

// Função para fazer login de usuário da empresa
export async function loginCompanyUser(subdomain: string, username: string, password: string): Promise<CompanyUser | null> {
  try {
    // Fazer hash da senha
    const passwordHash = await hashPassword(password);

    // Chamar função RPC para autenticar
    const { data, error } = await supabase.rpc('authenticate_company_user', {
      p_subdomain: subdomain,
      p_username: username,
      p_password_hash: passwordHash,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const companyUser = data[0];

    // Salvar no localStorage
    localStorage.setItem('company_user', JSON.stringify({
      id: companyUser.id,
      company_id: companyUser.company_id,
      username: companyUser.username,
      role: companyUser.role,
      is_active: companyUser.is_active,
    }));

    return {
      id: companyUser.id,
      company_id: companyUser.company_id,
      username: companyUser.username,
      role: companyUser.role,
      is_active: companyUser.is_active,
    };
  } catch (error) {
    console.error("Error logging in company user:", error);
    return null;
  }
}

// Função para fazer logout de usuário da empresa
export function logoutCompanyUser() {
  localStorage.removeItem('company_user');
}

// Função para obter usuário da empresa atual
export function getCurrentCompanyUser(): CompanyUser | null {
  try {
    const stored = localStorage.getItem('company_user');
    if (!stored) return null;
    return JSON.parse(stored) as CompanyUser;
  } catch {
    return null;
  }
}

