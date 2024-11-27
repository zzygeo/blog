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

## 持久化

每次在sentinel-dashboard里配置了规则，重启服务或者重启sentinel-dashboard都会导致规则的丢失，因此有必要将规则进行持久化。

### 本地持久化

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
