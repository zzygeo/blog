## 为什么要使用openfeign?

主要还是对外暴露某个服务的一系列接口，用来规范调用，当服务之间相互调用的时候，采用restTemplate+loadBalancer已经不方便管理了。而且openfeigin集成了loadBalancer的功能，并且可以结合sentinel来对接口进行限流降级。

## loadbalancer的算法切换

openfeign集成了loadbalancer，可实现均衡负载。

从轮询算法切换到随机算法的配置如下，记得一定要**指定这个负载均衡器的名称**，不然在调用的时候可能会出现错误，比如我测试调用网关进行路由转发的时候就出现了问题：

```java
@Configuration
@LoadBalancerClient(value = "pay-order", configuration = RestTemplateConfig.class)
public class RestTemplateConfig {

    @LoadBalanced
    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(Environment environment,
                                                            LoadBalancerClientFactory loadBalancerClientFactory) {
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        return new RandomLoadBalancer(loadBalancerClientFactory
                .getLazyProvider(name, ServiceInstanceListSupplier.class),
                name);
    }
}
```

## 超时控制

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          pay-order:
            connect-timeout: 5000
            read-timeout: 5000
```

## 超时重试和日志级别

当超过读取时间时，默认是不重试的，可以通过以下的配置来开启重试。

```java
@Configuration
public class FeignConfig {
    // 日志
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    // 重试
    @Bean
    public Retryer retryer() {
        // 初始间隔时间，最大间隔时间，最大次数
        return new Retryer.Default(100, 1, 3);
    }
}
```

## 更换Openfeign的调用库

Openfeign调用默认使用的是httpClient4（连接管理和线程池机制落后），官网已经不再推荐使用了，建议使用apache httpclient5。

添加依赖：

```xml
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
    <version>5.3</version>
</dependency>

<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-hc5</artifactId>
    <version>13.1</version>
</dependency>

```

在yaml里配置：

spring.cloud.openfeign.httpclient.hc5.enabled=true

## Openfeign的请求/响应压缩

配置以下内容：

```properties
spring.cloud.openfeign.compression.request.enabled=true
spring.cloud.openfeign.compression.request.mime-types=text/xml,application/xml,application/json # 触发请求的数据类型
spring.cloud.openfeign.compression.request.min-request-size=2048 # 触发请求的数据大小

spring.cloud.openfeign.compression.response.enabled=true
```
