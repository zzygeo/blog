## seata-server安装

先拉取seata-server的镜像。

```text
$ docker run --name seata-server -p 8091:8091 -p 7091:7091 apache/seata-server:2.2.0
```

复制配置文件到宿主机用来挂载。

```text
docker cp seata-serve:/seata-server/resources /User/seata/config
```

创建必要的表结构和undo_log表(模式)

[sql地址](https://github.com/apache/incubator-seata/blob/2.x/script/server/db/mysql.sql)

[undo_log地址(at)](https://github.com/apache/incubator-seata/tree/2.x/script/client/at/db)

配置application.yaml

```yaml
server:
  port: 7091

spring:
  application:
    name: seata-server

logging:
  config: classpath:logback-spring.xml
  file:
    path: ${log.home:${user.home}/logs/seata}
  extend:
    logstash-appender:
      destination: 127.0.0.1:4560
    kafka-appender:
      bootstrap-servers: 127.0.0.1:9092
      topic: logback_to_logstash

console:
  user:
    username: seata
    password: seata
seata:
  config:
    # support: nacos 、 consul 、 apollo 、 zk  、 etcd3
    type: nacos
    nacos:
      server-addr: ${nacos_host}:${nacos_port}
      namespace:
      group: SEATA_GROUP
      context-path:
      ##1.The following configuration is for the open source version of Nacos
      username: ${nacos_username}
      password: ${nacos_password}
      ##2.The following configuration is for the MSE Nacos on aliyun
      #access-key:
      #secret-key:
      ##3.The following configuration is used to deploy on Aliyun ECS or ACK without authentication
      #ram-role-name:
  registry:
    # support: nacos, eureka, redis, zk, consul, etcd3, sofa
    type: nacos
    nacos:
      application: seata-server
      server-addr: ${nacos_host}:${nacos_port}
      group: SEATA_GROUP
      namespace:
      cluster: default
      context-path:
      ##1.The following configuration is for the open source version of Nacos
      username: ${nacos_username}
      password: ${nacos_password}
      ##2.The following configuration is for the MSE Nacos on aliyun
      #access-key:
      #secret-key:
      ##3.The following configuration is used to deploy on Aliyun ECS or ACK without authentication
      #ram-role-name:
  store:
    # support: file 、 db 、 redis 、 raft
    mode: db
    db:
      datasource: druid
      db-type: mysql
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://${mysql_host}:${mysql_port}/seata_config?rewriteBatchedStatements=true
      user: ${mysql_username}
      password: ${mysql_password}
      min-conn: 10
      max-conn: 100
      global-table: global_table
      branch-table: branch_table
      lock-table: lock_table
      distributed-lock-table: distributed_lock
      vgroup-table: vgroup_table
      query-limit: 1000
      max-wait: 5000
  #  server:
  #    service-port: 8091 #If not configured, the default is '${server.port} + 1000'
  security:
    secretKey: SeataSecretKey0c382ef121d778043159209298fd40bf3850a017
    tokenValidityInMilliseconds: 1800000
    csrf-ignore-urls: /metadata/v1/**
    ignore:
    urls: /,/**/*.css,/**/*.js,/**/*.html,/**/*.map,/**/*.svg,/**/*.png,/**/*.jpeg,/**/*.ico,/api/v1/auth/login,/version.json,/health,/error,/vgroup/v1/**
```

配置docker-compose.yaml

```yaml
services:
  seata-server:
    image: apache/seata-server:2.2.0
    container_name: seata-server
    ports:
      - "8091:8091"
      - "7091:7091"
    environment:
      nacos_host: nacos
      nacos_port: 8848
      nacos_username: nacos
      nacos_password: nacos
      mysql_host: 
      mysql_port:
      mysql_username:
      mysql_password:
    volumes:
      - /Users/zzy/document/docker_data/seata/config:/seata-server/resources
    networks:
      - nacos_default

networks:
  nacos_default:
    external: true%   
```

在nacos里配置信息，**记得group和data-id信息一定写的和client端的一致**，比如SEATA_GROUP和seataServer.properties。

```properties
transport.protocol=seata
transport.type=TCP
transport.server=NIO
transport.heartbeat=true
transport.enableTmClientBatchSendRequest=false
transport.enableRmClientBatchSendRequest=true
transport.enableTcServerBatchSendResponse=false
transport.rpcRmRequestTimeout=30000
transport.rpcTmRequestTimeout=30000
transport.rpcTcRequestTimeout=30000
transport.threadFactory.bossThreadPrefix=NettyBoss
transport.threadFactory.workerThreadPrefix=NettyServerNIOWorker
transport.threadFactory.serverExecutorThreadPrefix=NettyServerBizHandler
transport.threadFactory.shareBossWorker=false
transport.threadFactory.clientSelectorThreadPrefix=NettyClientSelector
transport.threadFactory.clientSelectorThreadSize=1
transport.threadFactory.clientWorkerThreadPrefix=NettyClientWorkerThread
transport.threadFactory.bossThreadSize=1
transport.threadFactory.workerThreadSize=default
transport.shutdown.wait=3
transport.serialization=seata
transport.compressor=none

#Transaction routing rules configuration, only for the client
service.vgroupMapping.default_tx_group=default
#If you use a registry, you can ignore it
service.default.grouplist=127.0.0.1:8091
service.disableGlobalTransaction=false

client.metadataMaxAgeMs=30000
#Transaction rule configuration, only for the client
client.rm.asyncCommitBufferLimit=10000
client.rm.lock.retryInterval=10
client.rm.lock.retryTimes=30
client.rm.lock.retryPolicyBranchRollbackOnConflict=true
client.rm.reportRetryCount=5
client.rm.tableMetaCheckEnable=true
client.rm.tableMetaCheckerInterval=60000
client.rm.sqlParserType=druid
client.rm.reportSuccessEnable=false
client.rm.sagaBranchRegisterEnable=false
client.rm.sagaJsonParser=fastjson
client.rm.tccActionInterceptorOrder=-2147482648
client.rm.sqlParserType=druid
client.tm.commitRetryCount=5
client.tm.rollbackRetryCount=5
client.tm.defaultGlobalTransactionTimeout=60000
client.tm.degradeCheck=false
client.tm.degradeCheckAllowTimes=10
client.tm.degradeCheckPeriod=2000
client.tm.interceptorOrder=-2147482648
client.undo.dataValidation=true
client.undo.logSerialization=jackson
client.undo.onlyCareUpdateColumns=true
server.undo.logSaveDays=7
server.undo.logDeletePeriod=86400000
client.undo.logTable=undo_log
client.undo.compress.enable=true
client.undo.compress.type=zip
client.undo.compress.threshold=64k
#For TCC transaction mode
tcc.fence.logTableName=tcc_fence_log
tcc.fence.cleanPeriod=1h
# You can choose from the following options: fastjson, jackson, gson
tcc.contextJsonParserType=fastjson

#Log rule configuration, for client and server
log.exceptionRate=100

#Transaction storage configuration, only for the server. The file, db, and redis configuration values are optional.
store.mode=db
store.lock.mode=db
store.session.mode=db
#Used for password encryption
store.publicKey=

#These configurations are required if the `store mode` is `db`. If `store.mode,store.lock.mode,store.session.mode` are not equal to `db`, you can remove the configuration block.
store.db.datasource=druid
store.db.dbType=mysql
store.db.driverClassName=com.mysql.cj.jdbc.Driver
store.db.url=jdbc:mysql://***:***/seata_config?useUnicode=true&rewriteBatchedStatements=true
store.db.user=
store.db.password=
store.db.minConn=5
store.db.maxConn=30
store.db.globalTable=global_table
store.db.branchTable=branch_table
store.db.distributedLockTable=distributed_lock
store.db.vgroupTable=vgroup-table
store.db.queryLimit=100
store.db.lockTable=lock_table
store.db.maxWait=5000

#Transaction rule configuration, only for the server
server.recovery.committingRetryPeriod=1000
server.recovery.asynCommittingRetryPeriod=1000
server.recovery.rollbackingRetryPeriod=1000
server.recovery.timeoutRetryPeriod=1000
server.maxCommitRetryTimeout=-1
server.maxRollbackRetryTimeout=-1
server.rollbackFailedUnlockEnable=false
server.distributedLockExpireTime=10000
server.session.branchAsyncQueueSize=5000
server.session.enableBranchAsyncRemove=false
server.enableParallelRequestHandle=true
server.enableParallelHandleBranch=false
server.applicationDataLimit=64000
server.applicationDataLimitCheck=false

server.raft.server-addr=127.0.0.1:7091,127.0.0.1:7092,127.0.0.1:7093
server.raft.snapshotInterval=600
server.raft.applyBatch=32
server.raft.maxAppendBufferSize=262144
server.raft.maxReplicatorInflightMsgs=256
server.raft.disruptorBufferSize=16384
server.raft.electionTimeoutMs=2000
server.raft.reporterEnabled=false
server.raft.reporterInitialDelay=60
server.raft.serialization=jackson
server.raft.compressor=none
server.raft.sync=true


#Metrics configuration, only for the server
metrics.enabled=true
metrics.registryType=compact
metrics.exporterList=prometheus
metrics.exporterPrometheusPort=9898
```

在client端配置：

```yaml
seata:
  config:
    type: nacos
    nacos:
      server-addr: 127.0.0.1:8848
      namespace:
      group: SEATA_GROUP
      username: nacos
      password: nacos
      data-id: seataServer.properties
  tx-service-group: default_tx_group
  service:
    vgroup-mapping:
      default_tx_group: default # 事务组与TC服务集群的映射关系
      grouplist:
        default: ${seata.address:127.0.0.1}:${seata.port:8091}
  data-source-proxy-mode: AT
  application-id: seata-server
```

## at模式

两阶段提交协议的演变：
一阶段，业务数据和回滚日志记录在同一个本地事务中**提交**，申请全局锁（tc管理，记录xid、表名、执行的主键），**释放db锁和连接资源。**

二阶段：

提交异步化，非常快速地完成，释放全局锁，删除undo_log。

回滚，通过一阶段的**回滚日志进行反向补偿**。

具体来说：

### 一阶段

在一阶段，seata会拦截业务sql。

解析sql的含义，**找到业务sql要更新的业务数据，在业务数据被更新之前，将其保存为before image**。

执行业务sql更新业务数据，**在业务数据更新之后，将其保存为after image**，这里会直接提交分支事务，所以性能比较高，但是可能出现安全性问题。为了解决这个问题，引入了全局锁，即由TC记录当前正在操作某行数据的事务，该事务持有全局锁，具备执行权力，TC记录包含了事务的xid、操作的表名table，执行的主建pk。

以上操作全部在一个数据库事务里完成，保证了操作的原子性。

### 二阶段

在二阶段，分为两种情况。

顺利提交，因为业务sql在一阶段已经提交到了数据库，所以seata框架只需**将一阶段保存的快照数据和全局锁删掉，完成数据清理**即可。

异常数据，需要回滚一阶段已经执行的业务sql，还原业务数据。回滚方式便是**用before image还原业务数据**。

这里又分两种情况，事务都被seata管理和事务没有全部被seata管理。

如果都被seata管理，**比如a事务获取x数据的全局锁，尝试获取y数据的全局锁，b事务获取y数据的锁，尝试获取x数据的全局锁，此时相互持有对方的锁，造成了死锁。又或者某个事务长时间占用某个锁或者多个锁，导致其他事务迟迟拿不到锁无法执行，也会出现死锁**，因此seata引入了锁超时机制，重试获取全局锁，达到一定次数，直接抛出异常，回滚当前事务。

如果有事务没有被seata管理，那么它也不需要获取全局锁了，由于at模式下，分支事务是直接提交的，因此该事务直接就能获取db锁进行修改，如果seata全局事务回滚，有可能将不归seata管理的事务操作覆盖了，通用导致了脏写，因此seata在还原之前还需要**校验脏写**，对比数据库当前数据和after image，如果两份数据完全一致就说明**没有脏写**，可以还原业务数据，如果不一致就说明脏写，**出现脏写就需要转人工处理**。
