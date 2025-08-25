// Types for Redis Module
// Centralized type definitions

import type { RedisClientType, RedisClientOptions as RedisClientOptionsType } from 'redis';

export interface RedisKeyValue {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  ttl?: number;
}

export interface RedisHashField {
  key: string;
  field: string;
  value: string | number | boolean | Record<string, unknown>;
}

export interface RedisListItem {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  index?: number;
}

export interface RedisSetMember {
  key: string;
  member: string | number | boolean | Record<string, unknown>;
}

export interface RedisSortedSetMember {
  key: string;
  member: string | number | boolean | Record<string, unknown>;
  score: number;
}

export interface RedisTransaction {
  commands: Array<{
    command: string;
    args: (string | number | boolean)[];
  }>;
  watch?: string[];
}

export interface RedisPipeline {
  commands: Array<{
    command: string;
    args: (string | number | boolean)[];
  }>;
}

export interface RedisMetrics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageResponseTime: number;
  slowQueries: number;
  connections: number;
  memoryUsage: number;
  lastCommandTime: Date;
  uptime: number;
}

export interface RedisHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  error?: string;
  details: {
    ping: boolean;
    info: boolean;
    memory: boolean;
    connections: boolean;
  };
}

export interface RedisConnectionInfo {
  host: string;
  port: number;
  database: number;
  connected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  totalCommands: number;
  totalErrors: number;
}

export interface RedisKeyInfo {
  key: string;
  type: 'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream';
  ttl: number;
  size: number;
  lastAccessed?: Date;
}

export interface RedisMemoryInfo {
  usedMemory: number;
  usedMemoryPeak: number;
  usedMemoryRss: number;
  memFragmentationRatio: number;
  memAllocator: string;
  totalSystemMemory: number;
  maxMemory: number;
  maxMemoryPolicy: string;
}

export interface RedisInfo {
  server: {
    redisVersion: string;
    redisGitSha1: string;
    redisGitDirty: string;
    redisBuildId: string;
    redisMode: string;
    os: string;
    archBits: string;
    multiplexingApi: string;
    atomicvarApi: string;
    gccVersion: string;
    processId: number;
    runId: string;
    tcpPort: number;
    uptimeInSeconds: number;
    uptimeInDays: number;
    hz: number;
    lruClock: number;
    executable: string;
    configFile: string;
  };
  clients: {
    connectedClients: number;
    clientRecentMaxInputBuffer: number;
    clientRecentMaxOutputBuffer: number;
    blockedClients: number;
    trackingClients: number;
    clientsInTimeoutTable: number;
  };
  memory: RedisMemoryInfo;
  persistence: {
    loading: boolean;
    rdbChangesSinceLastSave: number;
    rdbBgsaveInProgress: boolean;
    rdbLastSaveTime: number;
    rdbLastBgsaveStatus: string;
    rdbLastBgsaveTimeSec: number;
    rdbCurrentBgsaveTimeSec: number;
    rdbLastCowSize: number;
    aofEnabled: boolean;
    aofRewriteInProgress: boolean;
    aofRewriteScheduled: boolean;
    aofLastRewriteTimeSec: number;
    aofCurrentRewriteTimeSec: number;
    aofLastBgrewriteStatus: string;
    aofLastWriteStatus: string;
    aofLastCowSize: number;
    aofCurrentSize: number;
    aofBaseSize: number;
    aofPendingRewrite: boolean;
    aofBufferLength: number;
    aofRewriteBufferLength: number;
    aofPendingBioFsync: number;
    aofDelayedFsync: number;
  };
  stats: {
    totalConnectionsReceived: number;
    totalCommandsProcessed: number;
    instantaneousOpsPerSec: number;
    totalNetInputBytes: number;
    totalNetOutputBytes: number;
    instantaneousInputKbps: number;
    instantaneousOutputKbps: number;
    rejectedConnections: number;
    syncFull: number;
    syncPartialOk: number;
    syncPartialErr: number;
    expiredKeys: number;
    expiredStalePerc: number;
    expiredTimeCapReachedCount: number;
    evictedKeys: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    pubsubChannels: number;
    pubsubPatterns: number;
    latestForkUsec: number;
    migrateCachedSockets: number;
    slaveExpiresTrackedKeys: number;
    activeDefragHits: number;
    activeDefragMisses: number;
    activeDefragKeyHits: number;
    activeDefragKeyMisses: number;
  };
  replication: {
    role: string;
    connectedSlaves: number;
    masterReplOffset: number;
    replBacklogActive: number;
    replBacklogSize: number;
    replBacklogFirstByteOffset: number;
    replBacklogHistlen: number;
  };
  cpu: {
    usedCpuSys: number;
    usedCpuUser: number;
    usedCpuSysChildren: number;
    usedCpuUserChildren: number;
  };
  commandstats: Record<string, {
    calls: number;
    usec: number;
    usecPerCall: number;
  }>;
  cluster: {
    enabled: boolean;
  };
  keyspace: Record<string, {
    keys: number;
    expires: number;
    avgTtl: number;
  }>;
}

export interface RedisPubSubMessage {
  channel: string;
  message: string;
  pattern?: string;
  timestamp: Date;
}

export interface RedisPubSubSubscription {
  channel: string;
  pattern?: string;
  callback: (message: RedisPubSubMessage) => void;
}

export interface RedisScript {
  name: string;
  script: string;
  keys: number;
  arguments: number;
}

export interface RedisScriptResult {
  script: string;
  result: unknown;
  duration: number;
}

export interface RedisScanResult<T = string> {
  cursor: number;
  keys: T[];
  hasMore: boolean;
}

export interface RedisScanOptions {
  match?: string;
  count?: number;
  type?: 'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream';
}

export interface RedisKeyPattern {
  pattern: string;
  type?: 'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream';
  count?: number;
}

export interface RedisKeyExpiration {
  key: string;
  ttl: number;
  expiresAt: Date;
}

export interface RedisKeyStatistics {
  totalKeys: number;
  keysByType: Record<string, number>;
  expiredKeys: number;
  evictedKeys: number;
  hitRate: number;
  averageTtl: number;
}

export interface RedisPerformanceMetrics {
  command: string;
  key?: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface RedisSlowLogEntry {
  id: number;
  timestamp: number;
  duration: number;
  command: string[];
  clientAddress: string;
  clientName: string;
}

export interface RedisLatencyHistory {
  event: string;
  latestLatency: number;
  maxLatency: number;
  avgLatency: number;
  samples: number;
}

export interface RedisLatencySpike {
  event: string;
  timestamp: number;
  latency: number;
}

export interface RedisConfigValue {
  parameter: string;
  value: string;
  source: 'config' | 'default' | 'command';
}

export interface RedisConfigSection {
  section: string;
  parameters: RedisConfigValue[];
}

export interface RedisClientConfig {
  client: RedisClientType;
  config: Record<string, unknown>;
  options: RedisClientOptionsType;
  connected: boolean;
  lastError?: Error;
  metrics: RedisMetrics;
  healthStatus: RedisHealthStatus;
}

export interface RedisPoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

export interface RedisPoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  acquiredConnections: number;
  releasedConnections: number;
  failedConnections: number;
  timeoutConnections: number;
}

export interface RedisPoolStatus {
  config: RedisPoolConfig;
  metrics: RedisPoolMetrics;
  healthy: boolean;
  lastError?: Error;
}

export interface RedisClusterNode {
  id: string;
  host: string;
  port: number;
  flags: string[];
  master?: string;
  pingSent: number;
  pongRecv: number;
  configEpoch: number;
  linkState: string;
  slots: string[];
}

export interface RedisClusterInfo {
  state: string;
  slotsAssigned: number;
  slotsOk: number;
  slotsPfail: number;
  slotsFail: number;
  knownNodes: number;
  size: number;
  currentEpoch: number;
  myEpoch: number;
  statsMessagesSent: number;
  statsMessagesReceived: number;
}

export interface RedisSentinelMaster {
  name: string;
  ip: string;
  port: number;
  flags: string[];
  numSlaves: number;
  numOtherSentinels: number;
  quorum: number;
  failoverTimeout: number;
  parallelSyncs: number;
}

export interface RedisSentinelSlave {
  name: string;
  ip: string;
  port: number;
  flags: string[];
  masterLinkDownTime: number;
  masterLinkStatus: string;
  masterHost: string;
  masterPort: number;
  slavePriority: number;
  slaveReplOffset: number;
}

export interface RedisSentinelInfo {
  masters: RedisSentinelMaster[];
  slaves: RedisSentinelSlave[];
  sentinels: Array<{
    name: string;
    ip: string;
    port: number;
    runId: string;
    flags: string[];
    linkPendingCommands: number;
    linkRefcount: number;
    lastPingSent: number;
    lastOkPingReply: number;
    lastPingReply: number;
    downAfterMilliseconds: number;
    lastHeardMilliseconds: number;
    votedLeader: string;
    votedLeaderEpoch: number;
  }>;
}
