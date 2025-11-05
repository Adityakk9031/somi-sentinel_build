import prisma from './client';

/**
 * Upsert a vault (create or update if exists)
 * @param vaultAddress - The on-chain vault contract address
 * @param ownerWallet - The wallet address of the vault owner
 * @param metadata - Optional vault metadata (name, description, etc.)
 * @returns The created or updated vault record
 */
export async function upsertVault(
  vaultAddress: string,
  ownerWallet: string,
  metadata?: {
    name?: string;
    description?: string;
    supportedTokens?: any[];
    totalValueUsd?: number;
    onchainCreatedAt?: Date;
  }
) {
  return prisma.vault.upsert({
    where: { vaultAddress },
    update: {
      ownerWallet,
      ...(metadata?.name !== undefined && { name: metadata.name }),
      ...(metadata?.description !== undefined && { description: metadata.description }),
      ...(metadata?.supportedTokens !== undefined && { supportedTokens: metadata.supportedTokens }),
      ...(metadata?.totalValueUsd !== undefined && { totalValueUsd: metadata.totalValueUsd }),
      updatedAt: new Date(),
    },
    create: {
      vaultAddress,
      ownerWallet,
      name: metadata?.name,
      description: metadata?.description,
      supportedTokens: metadata?.supportedTokens,
      totalValueUsd: metadata?.totalValueUsd,
      onchainCreatedAt: metadata?.onchainCreatedAt || new Date(),
    },
  });
}

/**
 * Upsert a policy for a vault
 * @param vaultAddress - The vault address this policy belongs to
 * @param policyJson - The policy configuration as JSON object
 * @param setBy - Optional wallet address that set this policy
 * @param deployedTx - Optional transaction hash of policy deployment
 * @returns อ// inserted policy ID
 */
export async function upsertPolicy(
  vaultAddress: string,
  policyJson: any,
  setBy?: string,
  deployedTx?: string
) {
  // First, check if there's an active policy for this vault
  const existingPolicy = await prisma.policy.findFirst({
    where: {
      vaultAddress,
      active: true,
    },
    orderBy: {
      version: 'desc',
    },
  });

  const nextVersion = existingPolicy ? existingPolicy.version + 1 : 1;

  // Deactivate old policy if exists
  if (existingPolicy) {
    await prisma.policy.update({
      where: { id: existingPolicy.id },
      data: { active: false, updatedAt: new Date() },
    });
  }

  // Create new policy
  return prisma.policy.create({
    data: {
      vaultAddress,
      policyJson,
      active: true,
      version: nextVersion,
      setBy,
      deployedTx,
    },
  });
}

/**
 * Get all policies for a vault, ordered by version (newest first)
 */
export async function getVaultPolicies(
  vaultAddress: string,
  activeOnly: boolean = false
) {
  return prisma.policy.findMany({
    where: {
      vaultAddress,
      ...(activeOnly && { active: true }),
    },
    orderBy: {
      version: 'desc',
    },
  });
}

/**
 * Get a vault with its latest active policy
 */
export async function getVaultWithPolicy(vaultAddress: string) {
  return prisma.vault.findUnique({
    where: { vaultAddress },
    include: {
      policies: {
        where: { active: true },
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  });
}

