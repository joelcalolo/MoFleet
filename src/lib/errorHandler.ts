/**
 * Utilitário para traduzir e melhorar mensagens de erro
 */

interface ErrorTranslation {
  pattern: RegExp;
  message: string;
}

const errorTranslations: ErrorTranslation[] = [
  // Erros de constraint único (duplicatas)
  {
    pattern: /duplicate key value violates unique constraint "cars_license_plate_key"/i,
    message: "Esta matrícula já está cadastrada. Por favor, use outra matrícula."
  },
  {
    pattern: /duplicate key value violates unique constraint.*license_plate/i,
    message: "Esta matrícula já está cadastrada. Por favor, use outra matrícula."
  },
  {
    pattern: /duplicate key value violates unique constraint.*email/i,
    message: "Este email já está cadastrado. Por favor, use outro email ou faça login."
  },
  {
    pattern: /duplicate key value violates unique constraint.*phone/i,
    message: "Este telefone já está cadastrado. Por favor, use outro telefone."
  },
  {
    pattern: /duplicate key value violates unique constraint/i,
    message: "Este registro já existe no sistema. Verifique os dados informados."
  },
  
  // Erros de foreign key
  {
    pattern: /violates foreign key constraint/i,
    message: "Referência inválida. Verifique se os dados relacionados existem."
  },
  {
    pattern: /insert or update on table.*violates foreign key constraint/i,
    message: "Não é possível realizar esta operação. Verifique se os dados relacionados estão corretos."
  },
  
  // Erros de autenticação
  {
    pattern: /invalid login credentials/i,
    message: "Email ou senha incorretos. Verifique suas credenciais."
  },
  {
    pattern: /email not confirmed/i,
    message: "Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada."
  },
  {
    pattern: /user not found/i,
    message: "Usuário não encontrado. Verifique se o email está correto."
  },
  {
    pattern: /invalid.*token/i,
    message: "Link inválido ou expirado. Solicite um novo link."
  },
  {
    pattern: /email rate limit exceeded/i,
    message: "Muitas tentativas de envio de email. Por favor, aguarde 15-30 minutos antes de tentar novamente. Este é um limite de segurança do sistema."
  },
  {
    pattern: /rate limit|too many requests|too many attempts/i,
    message: "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente. Este é um limite de segurança do sistema."
  },
  {
    pattern: /signup_disabled/i,
    message: "Cadastro temporariamente desabilitado. Tente novamente mais tarde."
  },
  
  // Erros de validação
  {
    pattern: /check constraint.*violated/i,
    message: "Dados inválidos. Verifique os campos preenchidos."
  },
  {
    pattern: /violates check constraint/i,
    message: "Alguns dados não atendem aos requisitos. Verifique os campos."
  },
  
  // Erros de reserva
  {
    pattern: /reservation.*overlap/i,
    message: "Esta reserva conflita com outra reserva existente para este carro no mesmo período."
  },
  {
    pattern: /overlapping reservation/i,
    message: "Já existe uma reserva para este carro no período selecionado."
  },
  
  // Erros de permissão
  {
    pattern: /permission denied/i,
    message: "Você não tem permissão para realizar esta ação."
  },
  {
    pattern: /row-level security/i,
    message: "Acesso negado. Você não tem permissão para acessar estes dados."
  },
  {
    pattern: /policy.*violated/i,
    message: "Operação não permitida. Verifique suas permissões."
  },
  
  // Erros de rede
  {
    pattern: /network.*error/i,
    message: "Erro de conexão. Verifique sua internet e tente novamente."
  },
  {
    pattern: /failed to fetch/i,
    message: "Não foi possível conectar ao servidor. Verifique sua conexão."
  },
  {
    pattern: /timeout/i,
    message: "A operação demorou muito. Tente novamente."
  },
  
  // Erros genéricos do Supabase
  {
    pattern: /new row violates row-level security policy/i,
    message: "Não foi possível criar este registro. Verifique suas permissões."
  },
  {
    pattern: /JWT.*expired/i,
    message: "Sua sessão expirou. Por favor, faça login novamente."
  },
  {
    pattern: /JWT.*invalid/i,
    message: "Sessão inválida. Por favor, faça login novamente."
  },
  
  // Erros de campo obrigatório
  {
    pattern: /null value in column.*violates not-null constraint/i,
    message: "Campos obrigatórios não preenchidos. Verifique o formulário."
  },
  
  // Erros de formato
  {
    pattern: /invalid input syntax/i,
    message: "Formato de dados inválido. Verifique os campos preenchidos."
  },
  
  // Erros de limite
  {
    pattern: /value too long/i,
    message: "Texto muito longo. Reduza o tamanho do campo."
  },
  
  // Erros de data
  {
    pattern: /invalid.*date/i,
    message: "Data inválida. Verifique o formato da data."
  },
  
  // Erros de número
  {
    pattern: /invalid.*number/i,
    message: "Número inválido. Verifique o valor informado."
  },
  
  // Erros de RLS (Row Level Security)
  {
    pattern: /infinite recursion detected in policy/i,
    message: "Erro de configuração do sistema. Entre em contato com o suporte."
  },
];

/**
 * Traduz e melhora mensagens de erro
 */
export function translateError(error: unknown): string {
  if (!error) {
    return "Ocorreu um erro desconhecido. Tente novamente.";
  }

  let errorMessage = "";

  // Extrair mensagem de erro
  if (typeof error === "string") {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "object" && error !== null) {
    // Tentar extrair mensagem de objetos de erro comuns
    const errorObj = error as any;
    errorMessage = errorObj.message || errorObj.error || errorObj.msg || JSON.stringify(error);
  } else {
    errorMessage = String(error);
  }

  // Normalizar mensagem (minúsculas para comparação)
  const normalizedMessage = errorMessage.toLowerCase();

  // Procurar tradução correspondente
  for (const translation of errorTranslations) {
    if (translation.pattern.test(errorMessage) || translation.pattern.test(normalizedMessage)) {
      return translation.message;
    }
  }

  // Se não encontrou tradução específica, retornar mensagem genérica melhorada
  if (errorMessage.includes("duplicate")) {
    return "Este registro já existe. Verifique se os dados não estão duplicados.";
  }

  if (errorMessage.includes("constraint")) {
    return "Dados inválidos. Verifique se todos os campos estão corretos.";
  }

  if (errorMessage.includes("permission") || errorMessage.includes("denied")) {
    return "Você não tem permissão para realizar esta ação.";
  }

  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }

  // Retornar mensagem original se não conseguir melhorar
  return errorMessage || "Ocorreu um erro. Tente novamente.";
}

/**
 * Exibe erro usando toast com mensagem traduzida
 */
export function handleError(error: unknown, defaultMessage?: string): string {
  const translatedMessage = translateError(error);
  
  // Se forneceu mensagem padrão e não encontrou tradução específica, usar padrão
  if (defaultMessage && translatedMessage === translateError("")) {
    return defaultMessage;
  }
  
  return translatedMessage;
}

/**
 * Log de erro para debug (apenas em desenvolvimento)
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ""}]`, error);
  }
}

