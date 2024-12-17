## sentinel接入项目

在springboot项目里导入依赖：

```xml

<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

在application.yaml里配置:

```yaml
spring:
  cloud:
    sentinel:
      transport:
        dashboard: 127.0.0.1:8081
        port: 8719

```

启动sentinel-dashboard:

```text
java -Dserver.port=8080 -Dcsp.sentinel.dashboard.server=localhost:8080 -Dproject.name=sentinel-dashboard -jar sentinel-dashboard.jar
```

## 限流和降级

调用的接口代码如下：

```java
@RestController
public class ConsumerController {
    @Autowired
    private FeignService feignService;

    @GetMapping("/sentinel/{name}")
    @SentinelResource(value = "getSentinelName", blockHandler = "testBlockHandler", blockHandlerClass = {Handler.class},
            fallback = "fallbackHandler", fallbackClass = {Handler.class})
    public String getSentinelName(@PathVariable(name = "name") String name){
        if ("111".equals(name)) {
            throw new RuntimeException("111");
        }
        return "common name: " + name;
    }

}
```

限流和降级的处理如下（如果不放在一个类下，一定要声明为static函数）

```java
public class Handler {
    public static String testBlockHandler(String name, BlockException e){
        // 熔断的异常走这个方法
        if (e instanceof DegradeException) {
            return "被降级: " + name;
        }
        return "被限流: " + name;
    }

    public static String fallbackHandler(String name, Throwable e){
        return "被降级: " + name;
    }
}
```

### 流控规则下的关联模式

b服务访问超过阈值，关闭a服务的请求。

### 流控规则下的链路模式

对于同一个资源，从a链路过来进行访问限制，从b链路过来不进行访问限制，如果测试的路径是在一个controller层,要配置spring.cloud.sentinel.web-context-unify改为false。

### 流控效果-预热冷启动

当系统长期处于低水位的情况下，当流量突然增加时，直接把系统拉升到高水位可能瞬间把系统压垮。

通过冷启动，**让通过的流量缓慢增加，在一定时间内逐渐增加到阈值上限**，给冷系统一个预热时间，避免冷系统被压垮。

### 流控效果-排队等待

当请求大于阈值的时候，比如每隔500ms允许下一个请求通过。

这种方式主要用于处理**间隔性**的突发的流量，例如消息队列。比如某一秒有大量请求过来，然后空闲几秒的场景，希望系统能够在接下来的空闲期间逐渐处理这些请求，而不是在第一秒直接拒绝多余的请求。

不适合qps > 1000这种请求。

### 熔断规则-慢调用比例

需要设置允许的慢调用RT（即最大的响应时间），请求的响应时间大于该值则统计为慢调用。

当单位统计时常内请求数目大于设置的最小请求数目，并且慢调用的比例大于阈值时，系统变为熔断状态，经过熔断时常后熔断器变成探测恢复状态。

### 熔断规则-异常比例

和慢调用比例类似，只不过处理的时异常情况。

### 熔断规则-异常数

统计时常内的异常数量大于设定的阈值，并且调用次数也超过最小请求数。

## 热点规则的使用

热点规则一般结合手动上报异常使用，这样能更加灵活的进行资源的管控，以下是一个例子。

```java
@GetMapping("/hotKey")
public String hotKey(String name, String age) {
    Entry entry = null;
    try {
        entry = SphU.entry("hotKey", EntryType.IN, 1, name, age);
        if ("111".equals(name)) {
            throw new NullPointerException();
        }
        // 被保护的业务逻辑
        return "hello java";
    } catch (Throwable ex) {
        // 这种编程方式需要手动上报异常
        // 如果是业务异常，那么就需要上报，上报以后才能正确触发熔断
        if (!BlockException.isBlockException(ex)) {
            Tracer.trace(ex);
            return "系统异常";
        }
        // 如果异常是熔断异常，执行此词条
        if (ex instanceof DegradeException) {
            return "触发熔断";
        }
        // 限流操作
        return "限流";
    } finally {
        if (entry != null) {
            entry.exit(1, name, age);
        }
    }
}
```

上面的代码里，entry声明资源的时候传入了2个参数，当在**sentinel-dashboard**为索引0配置热点规则的时候，请求时如果只有age参数则不会触发流控。

![sentinel-hotkey-rule](https://github.com/zzygeo/picx-images-hosting/raw/master/20241121/sentinel-hotkey-rule.99tdssdqjy.webp)

还可以在高级参数里，针对**特定字符串进行限流**，如下图：

![sentinel-hotkey-rule-params](https://github.com/zzygeo/picx-images-hosting/raw/master/20241121/sentinel-hotkey-rule-params.45pp4fsnn.webp)

针对name=224的情况，阈值就被调整到了10。

## 授权规则

很多时候，需要根据调用方的来源来判断是否通过此次请求，这时可以采用授权规则，根据来源的origin来判断是否允许通过，只有位于白名单的origin可以通过。

这个origin默认取的是ip，但是我们可以对其进行修改，比如以下例子，我改为判断token请求参数。

```java
@Component
public class MyRequestOriginParser implements RequestOriginParser {
    @Override
    public String parseOrigin(HttpServletRequest httpServletRequest) {
        return httpServletRequest.getHeader("token");
    }
}
```

然后在sentinel-dashboard配置的规则就是针对params里的token生效了

## 本地持久化

也就是将规则持久化到本地文件里，在服务启动、规则变更的时候会从本地文件读取规则、写入规则到本地文件，但是有一定的规则丢失的风险。

配置代码如下：

```java
@Configuration
public class SentinelDataSourceConfig implements InitFunc {

    @Value("spring.application.name")
    private String applicationName;
//    不实现InitFunc接口的话，采用下面的方式也可以
//    @PostConstruct
//    public void initFile() {
//        try {
//            init();
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }

    @Override
    // 本地持久化sentinel规则的配置
    public void init() throws Exception {
        String resourcePath = "";
        String projectRoot = System.getProperty("user.dir");
        String resourcesPath = projectRoot + "/src/main/resources/";
        String ruleDir = resourcesPath + "/sentinel/rules";
        String flowRulePath = ruleDir + "/flow-rule.json";
        String degradeRulePath = ruleDir + "/degrade-rule.json";
        String systemRulePath = ruleDir + "/system-rule.json";
        String authorityRulePath = ruleDir + "/authority-rule.json";
        String paramFlowRulePath = ruleDir + "/param-flow-rule.json";

        this.mkdirIfNotExits(ruleDir);
        this.createFileIfNotExits(flowRulePath);
        this.createFileIfNotExits(degradeRulePath);
        this.createFileIfNotExits(systemRulePath);
        this.createFileIfNotExits(authorityRulePath);
        this.createFileIfNotExits(paramFlowRulePath);

        // 流控规则
        // 注册一个可读数据源，用来定时读取本地的json文件，更新到规则缓存中
        ReadableDataSource<String, List<FlowRule>> flowRuleRDS =
                new FileRefreshableDataSource<>(flowRulePath, flowRuleListParser);
        // 将可读数据源注册至FlowRuleManager，这样当规则文件发生变化时，就会更新规则到内存
        FlowRuleManager.register2Property(flowRuleRDS.getProperty());
        // 创建一个可写数据源
        WritableDataSource<List<FlowRule>> flowRuleWDS = new FileWritableDataSource<>(
                flowRulePath,
                this::encodeJson
        );
        // 将可写数据源注册至transport模块的WritableDataSourceRegistry中
        // 这样收到控制台推送的规则时，Sentinel会先更新到内存，然后将规则写入到文件中
        WritableDataSourceRegistry.registerFlowDataSource(flowRuleWDS);

        // 降级规则
        ReadableDataSource<String, List<DegradeRule>> degradeRuleRDS = new FileRefreshableDataSource<>(
                degradeRulePath,
                degradeRuleListParser
        );
        DegradeRuleManager.register2Property(degradeRuleRDS.getProperty());
        WritableDataSource<List<DegradeRule>> degradeRuleWDS = new FileWritableDataSource<>(
                degradeRulePath,
                this::encodeJson
        );
        WritableDataSourceRegistry.registerDegradeDataSource(degradeRuleWDS);

        // 系统规则
        ReadableDataSource<String, List<SystemRule>> systemRuleRDS = new FileRefreshableDataSource<>(
                systemRulePath,
                systemRuleListParser
        );
        SystemRuleManager.register2Property(systemRuleRDS.getProperty());
        WritableDataSource<List<SystemRule>> systemRuleWDS = new FileWritableDataSource<>(
                systemRulePath,
                this::encodeJson
        );
        WritableDataSourceRegistry.registerSystemDataSource(systemRuleWDS);

        // 授权规则
        ReadableDataSource<String, List<AuthorityRule>> authorityRuleRDS = new FileRefreshableDataSource<>(
                authorityRulePath,
                authorityRuleListParser
        );
        AuthorityRuleManager.register2Property(authorityRuleRDS.getProperty());
        WritableDataSource<List<AuthorityRule>> authorityRuleWDS = new FileWritableDataSource<>(
                authorityRulePath,
                this::encodeJson
        );
        WritableDataSourceRegistry.registerAuthorityDataSource(authorityRuleWDS);

        // 热点参数规则
        ReadableDataSource<String, List<ParamFlowRule>> paramFlowRuleRDS = new FileRefreshableDataSource<>(
                paramFlowRulePath,
                paramFlowRuleListParser
        );
        ParamFlowRuleManager.register2Property(paramFlowRuleRDS.getProperty());
        WritableDataSource<List<ParamFlowRule>> paramFlowRuleWDS = new FileWritableDataSource<>(
                paramFlowRulePath,
                this::encodeJson
        );
        ModifyParamFlowRulesCommandHandler.setWritableDataSource(paramFlowRuleWDS);
    }

    private Converter<String, List<FlowRule>> flowRuleListParser = source -> JSON.parseObject(
            source,
            new TypeReference<List<FlowRule>>() {
            }
    );
    private Converter<String, List<DegradeRule>> degradeRuleListParser = source -> JSON.parseObject(
            source,
            new TypeReference<List<DegradeRule>>() {
            }
    );
    private Converter<String, List<SystemRule>> systemRuleListParser = source -> JSON.parseObject(
            source,
            new TypeReference<List<SystemRule>>() {
            }
    );

    private Converter<String, List<AuthorityRule>> authorityRuleListParser = source -> JSON.parseObject(
            source,
            new TypeReference<List<AuthorityRule>>() {
            }
    );

    private Converter<String, List<ParamFlowRule>> paramFlowRuleListParser = source -> JSON.parseObject(
            source,
            new TypeReference<List<ParamFlowRule>>() {
            }
    );

    private void mkdirIfNotExits(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            file.mkdirs();
        }
    }

    private void createFileIfNotExits(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            file.createNewFile();
        }
    }

    private <T> String encodeJson(T t) {
        return JSON.toJSONString(t);
    }

}
```

## 持久化到nacos

主要分为读取nacos配置到客户端，收集sentinel-dashboard的数据到nacos，这样就能实现数据的双向同步。

### 读取nacos配置到sentinel

额外引入这两个配置：

```xml

<dependencies>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
    </dependency>
    <dependency>
        <groupId>com.alibaba.csp</groupId>
        <artifactId>sentinel-datasource-nacos</artifactId>
    </dependency>
</dependencies>
```

配置yaml参数

```yaml
spring:
  application:
    name: consumer
  cloud:
    nacos:
      username: nacos
      password: nacos
      config:
        server-addr: 127.0.0.1:8848
      discovery:
        enabled: true
        server-addr: 127.0.0.1:8848
    sentinel:
      transport:
        dashboard: 127.0.0.1:8080
        port: 8719
      datasource:
        flow-rule: # 流控规则
          nacos:
            data-id: ${spring.application.name}-flow-rules.json
            server-addr: 127.0.0.1:8848
            rule-type: flow
            group-id: SENTINEL_FLOW_GROUP
            namespace: PUBLIC
            username: nacos
            password: nacos
        degrade-rule: # 熔断规则
          nacos:
            data-id: ${spring.application.name}-degrade-rules.json
            server-addr: 127.0.0.1:8848
            rule-type: degrade
            group-id: SENTINEL_DEGRADE_GROUP
            namespace: PUBLIC
            username: nacos
            password: nacos
        param-flow-rule: # 热点参数规则
          nacos:
            data-id: ${spring.application.name}-param-rules.json
            server-addr: 127.0.0.1:8848
            rule-type: param-flow
            group-id: SENTINEL_PARAM_FLOW_GROUP
            namespace: PUBLIC
            username: nacos
            password: nacos
  config:
    import: optional:nacos:instead
```

通过上面的配置可以保证读取到nacos里的sentinel规则配置，给不同的规则分配了不同的data-id和group-id，*
*但是如果在sentinel-dashboard里配置了新的规则，nacos是不知道的**，这时就要修改sentinel-dashboard的配置了。

我们知道sentinel-dashboard的配置创建和读取是走的内存，服务重启会丢失规则数据，所以重点是将读取和发布的方法改造成nacos形式的。

### sentinel-dashboard里配置NacosConfig

在yaml写入nacos服务的信息，然后创建一个nacos配置类交给spring管理。

```text
sentinel.nacos.server-addr=127.0.0.1:8848
sentinel.nacos.username=nacos
sentinel.nacos.password=nacos

sentinel.nacos.flow.group-id=SENTINEL_FLOW_GROUP
sentinel.nacos.degrade.group-id=SENTINEL_DEGRADE_GROUP
sentinel.nacos.param-flow.group-id=SENTINEL_PARAM_FLOW_GROUP
```

```java
@Configuration
@ConfigurationProperties(prefix = "sentinel.nacos")
public class NacosConfig {

    private String serverAddr;

    private String username;

    private String password;

    private String namespace;
    
    // 创建一个数据编码器，采用的fastjson，将规则信息序列化成str传给nacos
    @Bean
    public Converter<List<FlowRuleEntity>, String> flowRuleEntityEncoder() {
        return JSON::toJSONString;
    }
    / 创建一个数据解码器，采用的fastjson，将str形式的规则反序列化为规则对象
    @Bean
    public Converter<String, List<FlowRuleEntity>> flowRuleEntityDecoder() {
        return s -> JSON.parseArray(s, FlowRuleEntity.class);
    }
    // 创建一个nacos-client供后续使用
    @Bean
    public ConfigService nacosConfigService() throws Exception {
        Properties properties = new Properties();
        properties.put("serverAddr", serverAddr);
        properties.put("username", username);
        properties.put("password", password);
        return NacosFactory.createConfigService(properties);
    }

    public void setServerAddr(String serverAddr) {
        this.serverAddr = serverAddr;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getServerAddr() {
        return serverAddr;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getNamespace() {
        return namespace;
    }
}
```

### 实现DynamicRulePublisher和DynamicRuleProvider

sentinel里提供了DynamicRulePublisher和DynamicRuleProvider这两个接口，可用来实现动态规则读取和发布。

这里以流控规则举例，创建一个FlowRuleApiProvider和FlowRuleApiPublisher，核心就是改造getRules和publish方法，从原来的内存读写改成nacos的读写。

```java
@Component("flowRuleDefaultPublisher")
public class FlowRuleApiPublisher implements DynamicRulePublisher<List<FlowRuleEntity>> {

    @Autowired
    private SentinelApiClient sentinelApiClient;
    @Autowired
    private AppManagement appManagement;

    @Autowired
    private ConfigService configService;

    @Autowired
    private Converter<List<FlowRuleEntity>, String> converter;

    @Value("${sentinel.nacos.flow.group-id}")
    private String FLOW_GROUP_ID;


    @Override
    public void publish(String app, List<FlowRuleEntity> rules) throws Exception {
        if (StringUtil.isBlank(app)) {
            return;
        }
        if (rules == null) {
            return;
        }
        Set<MachineInfo> set = appManagement.getDetailApp(app).getMachines();

        for (MachineInfo machine : set) {
            if (!machine.isHealthy()) {
                continue;
            }
            // TODO: parse the results
//            sentinelApiClient.setFlowRuleOfMachine(app, machine.getIp(), machine.getPort(), rules);
            // 推送流控规则到nacos， data-id，group-id，rules
            // data-id和group-id需要和应用部分一致
            configService.publishConfig(app + NacosConfigUtil.FLOW_DATA_ID_POSTFIX, FLOW_GROUP_ID, converter.convert(rules));
        }
    }
}
```

```java
@Component("flowRuleDefaultProvider")
public class FlowRuleApiProvider implements DynamicRuleProvider<List<FlowRuleEntity>> {

    @Autowired
    private SentinelApiClient sentinelApiClient;
    @Autowired
    private AppManagement appManagement;

    @Autowired
    private Converter<String, List<FlowRuleEntity>> converter;

    @Autowired
    private ConfigService configService;

    @Value("${sentinel.nacos.flow.group-id}")
    private String FLOW_GROUP_ID;

    @Override
    public List<FlowRuleEntity> getRules(String appName) throws Exception {
        if (StringUtil.isBlank(appName)) {
            return new ArrayList<>();
        }
        List<MachineInfo> list = appManagement.getDetailApp(appName).getMachines()
            .stream()
            .filter(MachineInfo::isHealthy)
            .sorted((e1, e2) -> Long.compare(e2.getLastHeartbeat(), e1.getLastHeartbeat())).collect(Collectors.toList());
        if (list.isEmpty()) {
            return new ArrayList<>();
        } else {
            MachineInfo machine = list.get(0);

//            return sentinelApiClient.fetchFlowRuleOfMachine(machine.getApp(), machine.getIp(), machine.getPort());
            return converter.convert(configService.getConfig(appName + NacosConfigUtil.FLOW_DATA_ID_POSTFIX, FLOW_GROUP_ID, 3000));
        }
    }
}
```

### 修改相关controller层调用逻辑

从nacos读取配置和发布配置到nacos的类都写好以后，就需要到对应的接口代码里去接入读写逻辑。对于流控规则，sentinel读取的是FlowControllerV1类的接口，核心还是将原先通过sentinelApiClient调用的逻辑改为调用nacos的。

整体的controller层代码如下，注释调的就是原生的写法。

```java
/**
 * Flow rule controller.
 *
 * @author leyou
 * @author Eric Zhao
 */
@RestController
@RequestMapping(value = "/v1/flow")
public class FlowControllerV1 {

    private final Logger logger = LoggerFactory.getLogger(FlowControllerV1.class);

    @Autowired
    private InMemoryRuleRepositoryAdapter<FlowRuleEntity> repository;
    @Autowired
    private AppManagement appManagement;

//    @Autowired
//    private SentinelApiClient sentinelApiClient; // 用来保存到系统内存

    @Autowired
    @Qualifier("flowRuleDefaultProvider")
    private DynamicRuleProvider<List<FlowRuleEntity>> ruleProvider;

    @Autowired
    @Qualifier("flowRuleDefaultPublisher")
    private DynamicRulePublisher<List<FlowRuleEntity>> rulePublisher; // 用来保存到nacos



    @GetMapping("/rules")
    @AuthAction(PrivilegeType.READ_RULE)
    public Result<List<FlowRuleEntity>> apiQueryMachineRules(@RequestParam String app,
                                                             @RequestParam String ip,
                                                             @RequestParam Integer port) {
        if (StringUtil.isEmpty(app)) {
            return Result.ofFail(-1, "app can't be null or empty");
        }
        if (StringUtil.isEmpty(ip)) {
            return Result.ofFail(-1, "ip can't be null or empty");
        }
        if (port == null) {
            return Result.ofFail(-1, "port can't be null");
        }
        if (!appManagement.isValidMachineOfApp(app, ip)) {
            return Result.ofFail(-1, "given ip does not belong to given app");
        }
        try {
//            List<FlowRuleEntity> rules = sentinelApiClient.fetchFlowRuleOfMachine(app, ip, port);
            // 修改为从nacos读取数据
            List<FlowRuleEntity> rules = ruleProvider.getRules(app);
            if (!CollectionUtils.isEmpty(rules)) {
                for (FlowRuleEntity rule : rules) {
                    rule.setApp(app);
                    if (rule.getClusterConfig() != null && rule.getClusterConfig().getFlowId() != null) {
                        rule.setId(rule.getClusterConfig().getFlowId());
                    }
                }
            }
            rules = repository.saveAll(rules);
            return Result.ofSuccess(rules);
        } catch (Throwable throwable) {
            logger.error("Error when querying flow rules", throwable);
            return Result.ofThrowable(-1, throwable);
        }
    }

    private <R> Result<R> checkEntityInternal(FlowRuleEntity entity) {
        if (StringUtil.isBlank(entity.getApp())) {
            return Result.ofFail(-1, "app can't be null or empty");
        }
        if (StringUtil.isBlank(entity.getIp())) {
            return Result.ofFail(-1, "ip can't be null or empty");
        }
        if (entity.getPort() == null) {
            return Result.ofFail(-1, "port can't be null");
        }
        if (!appManagement.isValidMachineOfApp(entity.getApp(), entity.getIp())) {
            return Result.ofFail(-1, "given ip does not belong to given app");
        }
        if (StringUtil.isBlank(entity.getLimitApp())) {
            return Result.ofFail(-1, "limitApp can't be null or empty");
        }
        if (StringUtil.isBlank(entity.getResource())) {
            return Result.ofFail(-1, "resource can't be null or empty");
        }
        if (entity.getGrade() == null) {
            return Result.ofFail(-1, "grade can't be null");
        }
        if (entity.getGrade() != 0 && entity.getGrade() != 1) {
            return Result.ofFail(-1, "grade must be 0 or 1, but " + entity.getGrade() + " got");
        }
        if (entity.getCount() == null || entity.getCount() < 0) {
            return Result.ofFail(-1, "count should be at lease zero");
        }
        if (entity.getStrategy() == null) {
            return Result.ofFail(-1, "strategy can't be null");
        }
        if (entity.getStrategy() != 0 && StringUtil.isBlank(entity.getRefResource())) {
            return Result.ofFail(-1, "refResource can't be null or empty when strategy!=0");
        }
        if (entity.getControlBehavior() == null) {
            return Result.ofFail(-1, "controlBehavior can't be null");
        }
        int controlBehavior = entity.getControlBehavior();
        if (controlBehavior == 1 && entity.getWarmUpPeriodSec() == null) {
            return Result.ofFail(-1, "warmUpPeriodSec can't be null when controlBehavior==1");
        }
        if (controlBehavior == 2 && entity.getMaxQueueingTimeMs() == null) {
            return Result.ofFail(-1, "maxQueueingTimeMs can't be null when controlBehavior==2");
        }
        if (entity.isClusterMode() && entity.getClusterConfig() == null) {
            return Result.ofFail(-1, "cluster config should be valid");
        }
        return null;
    }

    @PostMapping("/rule")
    @AuthAction(PrivilegeType.WRITE_RULE)
    public Result<FlowRuleEntity> apiAddFlowRule(@RequestBody FlowRuleEntity entity) {
        Result<FlowRuleEntity> checkResult = checkEntityInternal(entity);
        if (checkResult != null) {
            return checkResult;
        }
        entity.setId(null);
        Date date = new Date();
        entity.setGmtCreate(date);
        entity.setGmtModified(date);
        entity.setLimitApp(entity.getLimitApp().trim());
        entity.setResource(entity.getResource().trim());
        try {
            entity = repository.save(entity);
            logger.info("entity toString, {}", entity);
//            publishRules(entity.getApp(), entity.getIp(), entity.getPort()).get(5000, TimeUnit.MILLISECONDS);
            publishRules(entity.getApp(), entity.getIp(), entity.getPort());
            return Result.ofSuccess(entity);
        } catch (Throwable t) {
            Throwable e = t instanceof ExecutionException ? t.getCause() : t;
            logger.error("Failed to add new flow rule, app={}, ip={}", entity.getApp(), entity.getIp(), e);
            return Result.ofFail(-1, e.getMessage());
        }
    }

    @PutMapping("/save.json")
    @AuthAction(PrivilegeType.WRITE_RULE)
    public Result<FlowRuleEntity> apiUpdateFlowRule(Long id, String app,
                                                  String limitApp, String resource, Integer grade,
                                                  Double count, Integer strategy, String refResource,
                                                  Integer controlBehavior, Integer warmUpPeriodSec,
                                                  Integer maxQueueingTimeMs) {
        if (id == null) {
            return Result.ofFail(-1, "id can't be null");
        }
        FlowRuleEntity entity = repository.findById(id);
        if (entity == null) {
            return Result.ofFail(-1, "id " + id + " dose not exist");
        }
        if (StringUtil.isNotBlank(app)) {
            entity.setApp(app.trim());
        }
        if (StringUtil.isNotBlank(limitApp)) {
            entity.setLimitApp(limitApp.trim());
        }
        if (StringUtil.isNotBlank(resource)) {
            entity.setResource(resource.trim());
        }
        if (grade != null) {
            if (grade != 0 && grade != 1) {
                return Result.ofFail(-1, "grade must be 0 or 1, but " + grade + " got");
            }
            entity.setGrade(grade);
        }
        if (count != null) {
            entity.setCount(count);
        }
        if (strategy != null) {
            if (strategy != 0 && strategy != 1 && strategy != 2) {
                return Result.ofFail(-1, "strategy must be in [0, 1, 2], but " + strategy + " got");
            }
            entity.setStrategy(strategy);
            if (strategy != 0) {
                if (StringUtil.isBlank(refResource)) {
                    return Result.ofFail(-1, "refResource can't be null or empty when strategy!=0");
                }
                entity.setRefResource(refResource.trim());
            }
        }
        if (controlBehavior != null) {
            if (controlBehavior != 0 && controlBehavior != 1 && controlBehavior != 2) {
                return Result.ofFail(-1, "controlBehavior must be in [0, 1, 2], but " + controlBehavior + " got");
            }
            if (controlBehavior == 1 && warmUpPeriodSec == null) {
                return Result.ofFail(-1, "warmUpPeriodSec can't be null when controlBehavior==1");
            }
            if (controlBehavior == 2 && maxQueueingTimeMs == null) {
                return Result.ofFail(-1, "maxQueueingTimeMs can't be null when controlBehavior==2");
            }
            entity.setControlBehavior(controlBehavior);
            if (warmUpPeriodSec != null) {
                entity.setWarmUpPeriodSec(warmUpPeriodSec);
            }
            if (maxQueueingTimeMs != null) {
                entity.setMaxQueueingTimeMs(maxQueueingTimeMs);
            }
        }
        Date date = new Date();
        entity.setGmtModified(date);
        try {
            entity = repository.save(entity);
            if (entity == null) {
                return Result.ofFail(-1, "save entity fail: null");
            }

//            publishRules(entity.getApp(), entity.getIp(), entity.getPort()).get(5000, TimeUnit.MILLISECONDS);
            publishRules(entity.getApp(), entity.getIp(), entity.getPort());
            return Result.ofSuccess(entity);
        } catch (Throwable t) {
            Throwable e = t instanceof ExecutionException ? t.getCause() : t;
            logger.error("Error when updating flow rules, app={}, ip={}, ruleId={}", entity.getApp(),
                entity.getIp(), id, e);
            return Result.ofFail(-1, e.getMessage());
        }
    }

    @DeleteMapping("/delete.json")
    @AuthAction(PrivilegeType.WRITE_RULE)
    public Result<Long> apiDeleteFlowRule(Long id) {

        if (id == null) {
            return Result.ofFail(-1, "id can't be null");
        }
        FlowRuleEntity oldEntity = repository.findById(id);
        if (oldEntity == null) {
            return Result.ofSuccess(null);
        }

        try {
            repository.delete(id);
        } catch (Exception e) {
            return Result.ofFail(-1, e.getMessage());
        }
        try {
//            publishRules(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort()).get(5000, TimeUnit.MILLISECONDS);
            publishRules(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort());
            return Result.ofSuccess(id);
        } catch (Throwable t) {
            Throwable e = t instanceof ExecutionException ? t.getCause() : t;
            logger.error("Error when deleting flow rules, app={}, ip={}, id={}", oldEntity.getApp(),
                oldEntity.getIp(), id, e);
            return Result.ofFail(-1, e.getMessage());
        }
    }

    private void publishRules(String app, String ip, Integer port) throws Exception {
//        List<FlowRuleEntity> rules = repository.findAllByMachine(MachineInfo.of(app, ip, port));
        List<FlowRuleEntity> rules = repository.findAllByApp(app);
        rulePublisher.publish(app, rules);
    }

//    初始代码
//    private CompletableFuture<Void> publishRules(String app, String ip, Integer port) throws Exception {
//        List<FlowRuleEntity> rules = repository.findAllByMachine(MachineInfo.of(app, ip, port));
//        return sentinelApiClient.setFlowRuleOfMachineAsync(app, ip, port, rules);
//    }
}
```

## sentinel对openfeign的支持

对于openfeign方法调用，主要还是统一处理**降级情况**，对于**单个方法，还是需要配置SentinelResource注解来进行异常的处理（限流、业务异常）**。

一般我们会有一个**通用的包存放services的定义**,在这里统一配置降级的处理

```java
@FeignClient(name = "provider", fallback = UserServiceFallback.class, configuration = FeignConfiguration.class)
public interface UserService {
}
```

其中UserServiceFallback.class提供具体的降级实现，FeignConfiguration.class用来提供Feign组件的自定义配置。

注意，FeignConfiguration.class**不需要添加@Configuration注解**，防止Spring将这个类当作常规配置类来处理，从而避免潜在的 Bean 重复定义问题。

```java
public class UserServiceFallback implements UserService {
    @Override
    public String getUserName(@PathVariable("name") String name) {
        return "我是降级方法";
    }
}
```

```java
public class FeignConfiguration {
    @Bean
    public UserServiceFallback userServiceFallback() {
        return new UserServiceFallback();
    }
}
```

## sentinel对网关对支持

sentinel对网关的支持是以route或者自定义的api分组进行的。

加入以下的依赖：

```xml
<dependencies>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>

    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
        <version>2023.0.1.2</version>
    </dependency>

    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-alibaba-sentinel-gateway</artifactId>
        <version>2023.0.1.2</version>
    </dependency>

    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-gateway</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
        <version>2.6.6</version>
    </dependency>
</dependencies>
```

加入以下的配置：

```java
@Configuration
public class GateWayConfig {

    @PostConstruct
    public void doInit() {
        // 这两不是必须的，也可以在dashboard中配置，或者从nacos中获取
        initCustomizedApis();
        initGatewayRules();
        // 设置自定义限流/降级处理
        setBlocHandler();
    }

    // 初始化api组
    private void initCustomizedApis() {
        Set<ApiDefinition> definitions = new HashSet<>();
        ApiDefinition api1 = new ApiDefinition("pay_route1")
                .setPredicateItems(new HashSet<ApiPredicateItem>() {{
                    add(new ApiPathPredicateItem().setPattern("/order/gateway/get/**")
                            .setMatchStrategy(SentinelGatewayConstants.URL_MATCH_STRATEGY_PREFIX));
                }});
        ApiDefinition api2 = new ApiDefinition("pay_route2")
                .setPredicateItems(new HashSet<ApiPredicateItem>() {{
                    add(new ApiPathPredicateItem().setPattern("/order/gateway/info/**")
                            .setMatchStrategy(SentinelGatewayConstants.URL_MATCH_STRATEGY_PREFIX));
                }});
        definitions.add(api1);
        definitions.add(api2);
        GatewayApiDefinitionManager.loadApiDefinitions(definitions);
    }
    // 初始化规则
    private void initGatewayRules() {
        Set<GatewayFlowRule> rules = new HashSet<>();
        rules.add(new GatewayFlowRule("pay_route1")
                // 流控最大值
                .setCount(2)
                // 时间间隔
                .setIntervalSec(1)
        );
        GatewayRuleManager.loadRules(rules);
    }

    private void setBlocHandler() {
        BlockRequestHandler blockRequestHandler = new BlockRequestHandler() {
            @Override
            public Mono<ServerResponse> handleRequest(ServerWebExchange exchange, Throwable ex) {
                HashMap<String, String> map = new HashMap<>();
                if (ex instanceof DegradeException) {
                    map.put("errorCode", HttpStatus.TOO_MANY_REQUESTS.toString());
                    map.put("errorMsg", "业务异常，请稍后重试");
                } else {
                    map.put("errorCode", HttpStatus.TOO_MANY_REQUESTS.toString());
                    map.put("errorMsg", "请求太频繁，触发了限流，请稍后重试");
                }
                return ServerResponse.status(HttpStatus.TOO_MANY_REQUESTS).contentType(MediaType.APPLICATION_JSON)
                        .body(BodyInserters.fromValue(map));
            }
        };
        GatewayCallbackManager.setBlockHandler(blockRequestHandler);
    }
}
```

**注意**：Sentinel 网关流控默认的粒度是 route 维度以及自定义 API 分组维度，默认不支持 URL 粒度。若通过 Spring Cloud Alibaba 接入，请将 spring.cloud.sentinel.filter.enabled 配置项置为 false（若在网关流控控制台上看到了 URL 资源，就是此配置项没有置为 false）。
