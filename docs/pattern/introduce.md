## 门面模式

### 定义

为一组复杂的子系统提供一个统一的接口，使得子系统更容易使用。

### 使用事项

聚合搜索类业务基本都是门面模式，即前端不关心后端怎么从不同的来源去聚合数据，通过一个接口来进行多种数据的查询。

**注意：当调用系统的客户端觉得麻烦的时候，就应该思考是不是可以抽象一个门面出来了。**

## 适配器模式

### 定义

允许不兼容的接口一起工作，通过将一个类的接口转换成客户端期望的另一个接口。

### 实际使用

1. 假如我们有一个统一的搜索规范，有用户名，有分页参数。

```java
public class SearchParam {
	String name;
	Long current;
    Long size;
}
```

2. 创建一个搜索的规范接口。

```java
public interface Search {
    Page<T> search(String name, Long current, Long size);
}
```

3. 这时我们有两种搜索的方法，例如。

```java
Page<User> pageUser(PageUserRequest pageUserRequest);
Page<Good> pageUser(PageGoodRequest pageGoodRequest);
```

4. 使用适配器模式。

3提到的方法可能是来自其他微服务的，压根就不是自己写的，怎么进行接入呢，就需要用到适配器模式了。

```java{7}
public class UserSearch<User> implement Search {
    private UserService userService;
    Page<User> search(String name, Long current, Long size) {
		PageUserRequest pageUserRequest = new PageUserRequest();
        pageUserRequest.setName(name)
        // ...
        userService.pageUser(pageUserRequest)
    }
}
```

## 注册器模式

### 定义

通常用来创建一个注册表，允许对象在运行时被查找和访问。这个模式通常用于服务定位模式中。

### 使用

```java
public class ServiceRegistry {
    private static final Map<String, Object> services = new HashMap<>();

    public static void registerService(String serviceName, Object service) {
        services.put(serviceName, service);
    }

    public static Object getService(String serviceName) {
        return services.get(serviceName);
    }
}

```



## 单例模式

### 定义

单例模式确保一个类只有一个实例，并提供全局访问点来访问这个实例。

### 使用

```java
public class Singleton {
    private static Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

## 工厂模式

### 定义

义了一个用于创建对象的接口，让子类决定实例化哪一个类。工厂方法使一个类的实例化延迟到其子类。

### 使用

```java
public interface Animal {
    void speak();
}

public class Dog implements Animal {
    public void speak() {
        System.out.println("Woof");
    }
}

public class Cat implements Animal {
    public void speak() {
        System.out.println("Meow");
    }
}

public class AnimalFactory {
    public Animal getAnimal(String type) {
        if ("dog".equals(type)) {
            return new Dog();
        } else if ("cat".equals(type)) {
            return new Cat();
        }
        throw new IllegalArgumentException("Unknown animal type");
    }
}

```

