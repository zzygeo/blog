## Gateway基本介绍

在spring生态之上构建的API网关服务，旨在为微服务架构提供一种**简单有效的统一的API路由管理**模式。

主要有3大组成部分，路由、断言、过滤器。

路由：是构成网关的基本模块，由id，目标url，一系列的断言器和过滤器组成，断言为true则匹配该路由。

断言：参考的是java8的util.function.predicate，开发人员可以配置一系列http请求中的内容（如请求头和参数），如果断言成功则通过请求。

过滤：可以在请求到来之前或者之后对请求进行修改、处理。

## 路由的url配置成lb形式

lb就是loadbalancer的简写，显然每次在url里写固定的地址是不合适的，而且也没有负载均衡的功能，需要将loadbalancer的pom引入，将注册中心也配置好，然后通过 lb://服务名 调用。

## gateway转发通过feign调用的接口

**将gateway配置到注册中心以后**，修改以前通过内部互相调用的服务，在服务提供者前加一层网关了，这样可以对流量进行控制（比如共网调用时的鉴权）。

## 断言

### after before：

匹配的是java ZonedDateTime

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: after_route
          uri: https://example.org
          predicates:
          - After=2017-01-20T17:42:47.789-07:00[America/Denver]
```

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: before_route
          uri: https://example.org
          predicates:
          - Before=2017-01-20T17:42:47.789-07:00[America/Denver]
```

### between

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: between_route
          uri: https://example.org
          predicates:
          - Between=2017-01-20T17:42:47.789-07:00[America/Denver], 2017-01-21T17:42:47.789-07:00[America/Denver]
```

### Cookie

需要两个参数，一个key表示CookieName，一个是值。

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: cookie_route
          uri: https://example.org
          predicates:
          - Cookie=chocolate, ch.p
```

### Header

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: header_route
          uri: https://example.org
          predicates:
          - Header=X-Request-Id, \d+
```

### Host

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: host_route
          uri: https://example.org
          predicates:
          - Host=**.somehost.org,**.anotherhost.org
```

### Path

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: path_route
          uri: https://example.org
          predicates:
          - Path=/red/{segment},/blue/{segment}
```

### Method

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: method_route
          uri: https://example.org
          predicates:
          - Method=GET,POST
```

### Query

请求地址上必须带有userId=数字&version=1.0的参数。

```yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: query_route
          uri: https://example.org
          predicates:
            - Query=userId, \d+
            - Query=version, 1.0
```

### Weight

接受一个组名+权重值，将有80%的流量落到https://weighthigh.org地址上。

```
spring:
  cloud:
    gateway:
      mvc:
        routes:
        - id: weight_high
          uri: https://weighthigh.org
          predicates:
          - Weight=group1, 8
        - id: weight_low
          uri: https://weightlow.org
          predicates:
          - Weight=group1, 2
```

### 自定义断言

具体参考Host路由规则的实现，要点是**类的名称要符合规则，实现配置类、实现接口的apply方法**。

```java
// 命名规则：自定义路由断言工厂类名+RoutePredicateFactory
@Component
public class CustomRoutePredicateFactory extends AbstractRoutePredicateFactory<CustomRoutePredicateFactory.Config> {

    public static final String CUSTOM_KEY = "names";

    public CustomRoutePredicateFactory() {
        super(CustomRoutePredicateFactory.Config.class);
    }
    // 配置短捷方式
    @Override
    public List<String> shortcutFieldOrder() {
        return Collections.singletonList(CUSTOM_KEY);
    }
    // 配置快捷方式类型，比如GATHER_LIST GATHER_LIST_TAIL_FLAG DEFAULT
    @Override
    public ShortcutType shortcutType() {
        return ShortcutType.GATHER_LIST;
    }

    // 重写apply方法，断言成功返回true，否则返回false
    @Override
    public Predicate<ServerWebExchange> apply(final CustomRoutePredicateFactory.Config config) {
        return new GatewayPredicate() {
            public boolean test(ServerWebExchange exchange) {
                String name = exchange.getRequest().getQueryParams().getFirst("name");
                if (name == null) {
                    return false;
                }
                AtomicBoolean flag = new AtomicBoolean(false);
                config.getNames().forEach(s -> {
                    if (name.equals(s)) {
                        flag.set(true);
                    }
                });
                return flag.get();
            }
        };
    }
    // 实现自定义配置类
    @Validated
    public static class Config {
        private List<String> names;

        public Config() {
        }

        public List<String> getNames() {
            return names;
        }

        public void setNames(List<String> names) {
            this.names = names;
        }
    }
}
```

对应的yaml里的路由规则为：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: pay_route2
          uri: lb://pay-order
          predicates:
            - Path=/order/gateway/info/**
            - name: Custom
              args:
                names: aaa,bbb #如果params里有任一个则通过
```

由于上面配置了短捷方法，也可以像下面这么写：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: pay_route2
          uri: lb://pay-order
          predicates:
            - Path=/order/gateway/info/**
            - Custom=aaa, bbb
```

## 过滤器

又分为**全局默认过滤器**和针对**单一路由的过滤器**。

单一路由的过滤器分：

请求头相关组、请求参数相关组、回应头相关组、前缀和路径相关组、默认（全局）过滤器。



### 自定义全局过滤器

```java
@Component
public class CustomFilter implements GlobalFilter, Ordered {
    private static String START_TIME = "start_time";
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        exchange.getAttributes().put(START_TIME, System.currentTimeMillis());
        Mono<Void> then = chain.filter(exchange).then(Mono.fromRunnable(() -> {
            Long startTime = (Long) exchange.getAttributes().get(START_TIME);
            if (startTime != null) {
                System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
            }
        }));
        return then;
    }

    // 数字越小、优先级越高
    @Override
    public int getOrder() {
        return 0;
    }
}
```

### 自定义过滤器规则

自定义过滤器的写法和自定义断言的写法类似，可以参考SetPathGatewayFilterFactory这个类进行实现。
