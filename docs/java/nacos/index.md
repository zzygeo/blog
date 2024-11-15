## 引入

微服务与传统单体式应用架构最大区别就是强调软件模块的拆分。在单体架构下，一个应用系统的多个功能模块由于组织在一起在同一个应用进程内部署与运行，因此，模块之间直接通过方法调用即可完成对一次请求的响应。但在微服务系统中，需要对一个应用系统根据其功能特点，按照一定粒度进行拆分后单独部署，以便实现模块内的高内聚，模块间的低耦合，实现整个微服务系统的高可扩展性。

原来一次在一个应用内即可完成的请求处理，会出现跨进程跨主机的服务调用，*
*如何让这个服务之间能互相发现像单体式应用一样提供统一对外的服务调用能力是微服务框架层面需要重点解决的核心问题之一**
。服务注册与发现模型由此诞生了。

## 分布式配置中心的作用

1. 管理应用程序配置：当有大量应用程序需要管理时，**手动维护配置文件会变得非常困难**。分布式配置中心提供了一个集中管理和分发配置信息的解决方案。

2. 环境隔离：在开发、测试和生产等不同环境中，应用程序的配置信息往往都会有不同。使用分布式配置中心，可以**轻松地管理和分发不同环境下的配置信息
   **。

3. 提高程序安全性：将配置信息存储在代码库或应用程序文件中可能会导致安全风险，因为这些信息可能会被意外地泄漏或被恶意攻击者利用。使用分布式配置，可以将配置信息加密和保护。

4. 动态更新配置：在应用程序运行时，可能需要动态地更新配置信息，以便应用程序可以及时响应变化。

## 启动nacos

### 创建一个数据库

直接找到alibaba/nacos仓库的[mysql表文件](https://github.com/alibaba/nacos/blob/develop/distribution/conf/mysql-schema.sql)
创建一个数据库，在docker-compose启动的时候需要指定这个数据库。

### docker-compose

```yaml
services:
  nacos:
    image: nacos/nacos-server:v2.2.0
    ports:
      - "8848:8848"
      - "9848:9848"
      - "9849:9849"
    environment:
      JVM_XMS: 256m
      JVM_XMX: 256m
      MODE: standalone
      MYSQL_SERVICE_HOST: 127.0.0.1
      MYSQL_SERVICE_DB_NAME: nacos_config
      MYSQL_SERVICE_USER: root
      MYSQL_SERVICE_PASSWORD: 123
    volumes:
      - /Users/zzy/document/docker_data/nacos/logs:/home/nacos/logs
      - /Users/zzy/document/docker_data/nacos/conf:/home/nacos/conf
    restart: always
```

## 使用云原生脚手架创建

[地址](https://start.aliyun.com/?spm=a2c6h.12873639.article-detail.7.4c8b5f3bdGfCws)

## 使用

介绍一些nacos的基本使用方法和tips。

### 动态获取nacos的配置

配置依赖

```xml
 <dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
 </dependency>
```

yaml配置

```yaml
spring:
  application:
    name: nacos-config-example
  cloud:
    nacos:
      config:
        serverAddr: 127.0.0.1:8848
        username: 'nacos'
        password: 'nacos'
        extendKey: value
        refresh-enabled: true # 自动刷新配置，默认为true，不设置这个无法自动刷新配置
  config:
    import:
      - nacos:nacos-config-example.properties?refresh=true
```

将nacos的configdata配置调整为debug可以看到每次配置变更时重新加载的配置

```yaml
logging:
  level:
    com.alibaba.cloud.nacos.configdata: debug
```

### 代码控制配置crud

一段介绍获取配置、创建配置、删除配置、监听配置的代码如下：

```java
@RestController
@RequestMapping("/nacos")
public class DockingInterfaceExample {

	Logger logger = LoggerFactory.getLogger(DockingInterfaceExample.class);

	/**
	 * Nacos group.
	 */
	public static final String DEFAULT_GROUP = "DEFAULT_GROUP";

	@Autowired
	private NacosConfigManager nacosConfigManager;

	/**
	 * Get configuration information. 获取配置
	 *
	 * @param dataId dataId
	 * @param group group
	 * @return config
	 */
	@RequestMapping("/getConfig")
	public String getConfig(@RequestParam("dataId") String dataId,
			@RequestParam(value = "group", required = false) String group)
			throws NacosException {
		if (StringUtils.isEmpty(group)) {
			group = DEFAULT_GROUP;
		}
		ConfigService configService = nacosConfigManager.getConfigService();
		return configService.getConfig(dataId, group, 2000);
	}

	/**
	 * Publish configuration. 发布配置信息
	 *
	 * @param dataId dataId
	 * @param group group
	 * @param content content
	 * @return boolean
	 */
	@RequestMapping("/publishConfig")
	public boolean publishConfig(@RequestParam("dataId") String dataId,
			@RequestParam(value = "group", required = false) String group,
			@RequestParam("content") String content) throws NacosException {
		if (StringUtils.isEmpty(group)) {
			group = DEFAULT_GROUP;
		}
		ConfigService configService = nacosConfigManager.getConfigService();
		return configService.publishConfig(dataId, group, content);
	}

	/**
	 * Delete configuration. 删除配置
	 *
	 * @param dataId dataId
	 * @param group group
	 * @return boolean
	 */
	@RequestMapping("/removeConfig")
	public boolean removeConfig(@RequestParam("dataId") String dataId,
			@RequestParam(value = "group", required = false) String group)
			throws NacosException {
		if (StringUtils.isEmpty(group)) {
			group = DEFAULT_GROUP;
		}
		ConfigService configService = nacosConfigManager.getConfigService();
		return configService.removeConfig(dataId, group);
	}

	/**
	 * Add listener configuration information. 增加监听
	 *
	 * @param dataId dataId
	 * @param group group
	 */
	@RequestMapping("/listener")
	public String listenerConfig(@RequestParam("dataId") String dataId,
			@RequestParam(value = "group", required = false) String group)
			throws NacosException {
		if (StringUtils.isEmpty(group)) {
			group = DEFAULT_GROUP;
		}
		ConfigService configService = nacosConfigManager.getConfigService();
		configService.addListener(dataId, group, new Listener() {
			@Override
			public Executor getExecutor() {
				return Executors.newSingleThreadExecutor();
			}

			@Override
			public void receiveConfigInfo(String configInfo) {
				logger.info("[Listen for configuration changes]:{}", configInfo);
			}
		});
		return "Add Lister successfully!";
	}
}
```

### 使用@Value获取配置

当使用@Value获取配置的时候，一定要使用@RefreshScope注解。

@RefreshScope会在配置变更的时候，销毁原来的bean，创新新的bean。

验证如下，有以下的配置类。

```java
@RestController
@RequestMapping("/nacos/annotation")
@RefreshScope // 当使用@Value注解时，需要添加@RefreshScope注解,这个注解在配置变更时会销毁bean，重新创建bean
public class ValueAnnotationExample {

	@Value("${spring.cloud.nacos.config.serverAddr:}")
	private String serverAddr;

	@Value("${spring.cloud.nacos.config.prefix:}")
	private String prefix;

	@Value("${spring.cloud.nacos.config.group:}")
	private String group;

	@Value("${spring.cloud.nacos.config.namespace:}")
	private String namespace;

	@GetMapping
	public Map<String, String> getConfigInfo() {
		Map<String, String> result = new HashMap<>(4);
		result.put("serverAddr", serverAddr);
		result.put("prefix", prefix);
		result.put("group", group);
		result.put("namespace", namespace);
		System.out.println(this);
		return result;
	}
}
```

先请求一次接口，然后在nacos里修改group信息，再次请求，观察两次的打印。

修改前：

```text
GROUP11
com.alibaba.cloud.examples.example.ValueAnnotationExample@7b46b2d3
```

修改后

```text
GROUP
com.alibaba.cloud.examples.example.ValueAnnotationExample@5246b1ac
```

可以看到前后输出的实例的地址变了。

### actuator/refresh手动触发更新

修改配置如下，关闭自动刷新，开放actuator的refresh端点。

```yaml
spring:
  application:
    name: nacos-config-example
  cloud:
    nacos:
      config:
        serverAddr: 127.0.0.1:8848
        username: 'nacos'
        password: 'nacos'
        extendKey: value
        refresh-enabled: false # 自动刷新配置
  config:
    import:
      - nacos:nacos-config-example.properties?refresh=true
management:
  endpoint:
    health:
      show-details: always
  endpoints:
    web:
      exposure:
        include: 'refresh'
```

这种情况下，即使修改了nacos的配置，也不会自动刷新配置（**自己监听的配置可以**）。

当使用post方式请求host:port/actuator/refresh端点时（需要**开放refresh端点**），会触发更新，比如使用curl。

```text
curl -X POST http://localhost:18084/actuator/refresh
```
