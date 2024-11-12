## 基础知识

**在一个地球上，尽管人处于不同的时区，但是所对应的时刻是一致的**，采用的标准是utc（协调世界时，Coordinated Universal Time）是一种时间标准，它是国际时间标准，用于在全球范围内进行时间同步。UTC是由国际电信联盟（ITU）定义的，并由世界时间标准机构（BIPM）进行维护。

因此时间统一就是在此基础上进行建立的。

## jdbc postgres的时区设置

服务器时区：在数据库的配置文件里可以设置时区，会影响select now()、CURRENT_TIMESTAMP等函数的时间。

客户端时区：在java里就是jvm里设置的时区，当然网页前给用户看的时区也叫客户端时区。

时间不统一的问题就是服务器时区和客户端时区不一致导致的，比如执行定时任务，定时任务查询数据库，在java代码里又写了比较的时间，结果一个是0区时间，对比的却是8区时间，当然就会有问题。

再比如，网页接受用户时间的时候，客户在东八区，他理解时间是东八区的，结果服务器是直接按照utc时间存的，结果存入的时间大了8小时。

在pg里，不管数据库设置的是什么时区，存入的都是时间戳。当设置时间类型为timestampz，jdbc会自动根据jvm设置的时区进行时间转换，测试例子如下：

```java
@Test
public void test() throws Exception{
    Connection connection = DriverManager.getConnection("jdbc:postgresql://localhost:5432/gis?currentSchema=public", USERNAME, PASSWORD);
    ResultSet resultSet = connection.createStatement().executeQuery("select * from public.my_user");
    while (resultSet.next()){
        String updateTime = resultSet.getString("update_time");
        System.out.println(updateTime);
    }
}
```

结果如下：

![postgres0时区](https://raw.githubusercontent.com/zzygeo/picx-images-hosting/master/postgres0%E6%97%B6%E5%8C%BA.83a25idev7.webp)


当我使用东八区，结果如下：

![postgres8时区](https://github.com/zzygeo/picx-images-hosting/raw/master/postgres8时区.4jo4fpcpv5.webp)

因此在使用postgres的时候，时间类型尽量**使用timestampz，这样设置好jvm的时区时区**转换就ok了。

## jdbc mysql时区的问题

在mysql里，一般使用timestamp来存储数据，存储的是时间戳信息，以UTC时间为标准。

当插入时自动添加时间、更新时添加时间时，需要设置current_timestamp，这时要保证mysql数据库设置的时区为Asia/Shanghai。

**jdbc mysql的serverTimezone设置会指定mysql服务器的时区，当查询数据到达客户端（java端）会和jvm设置的时区进行比较然后进行转换。**

当设置serverTimeZone=Asia/Shanghai时，jdbc参数和查询的结果如下：

```text
url: jdbc:mysql://localhost:3306/test_template?serverTimezone=Asia/Shanghai

"createTime": "2024-09-08 17:55:47",
"updateTime": "2024-09-08 17:55:47",
```

当设置serverTimeZone=UTC时，jdbc参数和查询的结果如下：

```text
url: jdbc:mysql://localhost:3306/test_template?serverTimezone=UTC

"createTime": "2024-09-09 01:55:47",
"updateTime": "2024-09-09 01:55:47",
```

这里将原本+8的时间当作了utc时间，因此在转换的时候时间自然就变大了8小时。

**因此对于mysql，通过连接时配置数据库server的时区，并通过两时区的对比，返回正确的客户端时区的时间。**
