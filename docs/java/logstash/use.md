## 介绍

[logstash](https://www.elastic.co/guide/en/logstash/current/introduction.html)是一个数据收集和处理的管道，可以动态的收集不同来源的数据，根据约定处理成你想要的格式。

## 安装

### 下载执行包

尽量选择和es同版本的包，[下载地址](https://www.elastic.co/downloads/past-releases#logstash)。

### docker方式

## 控制台的简单示例

在config文件底下创建test.conf文件，内容为：

```config
input {
  stdin { }
}

output {
stdout { }
}
```

mac电脑执行执行./bin/logstash -f ./config/test.conf，windows自行换成bat的程序。

执行结果如下，数据收集和输出构成了logstash的最基本的组成部分。

![logstash的简单测试](https://github.com/zzygeo/picx-images-hosting/raw/master/20241101/logstash的简单测试.2rv56f7p72.webp)

## 从数据库收集数据

在插件章节找到[jdbc部分](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-jdbc.html)，官网示例如下：

```config
input {
  jdbc {
    jdbc_driver_library => "mysql-connector-java-5.1.36-bin.jar"
    jdbc_driver_class => "com.mysql.jdbc.Driver"
    jdbc_connection_string => "jdbc:mysql://localhost:3306/mydb"
    jdbc_user => "mysql"
    parameters => { "favorite_artist" => "Beethoven" }
    schedule => "* * * * *"
    statement => "SELECT * from songs where artist = :favorite_artist"
  }
}
```

- jdbc_driver_library直接复制maven仓库的jar包就好，填写为绝对路径。

- jdbc_connection_string填写为实际路径。

- jdbc_user、jdbc_password按需要添加。

- parameters是占位参数，好处有**速度快（只需局部替换）、模板、一定的防注入能力**。

- schedule是一个[cron表达式](https://zhuanlan.zhihu.com/p/437328366)写法。

- statement决定了查询的语句，从而决定了输入哪些数据。

下面是一个改造过后的语句。

```config
input {
  jdbc {
    jdbc_driver_library => "/Users/zzy/Downloads/logstash-7.17.9/config/postgresql-42.7.2.jar"
    jdbc_driver_class => "org.postgresql.Driver"
    jdbc_connection_string => "jdbc:postgresql://localhost:5432/gis?currentSchema=public"
    jdbc_user => "zzygeo"
    jdbc_password => "****"
    schedule => "*/5 * * * * *"
    statement => "select * from my_user where update_time > :sql_last_value and update_time < now() order by update_time asc"
    use_column_value => true
    tracking_column => "update_time"
    tracking_column_type => "timestamp"
    jdbc_default_timezone => "Asia/Shanghai"
  }
}

output {
  stdout { }
}
```

变化的点有以下：

statement变成了查询最后一次更新时间以后的数据，这里的:sql_last_value也是占位的写法，它跟use_column_value、tracking_column_type、tracking_column_type强相关，分别决定了是否采用占位的值、依据哪列及列类型。

因此务必按时间升序来查询，这个占位的值取得是上次查询的数据的最后一行（即最后一次更新时间），这个值陪持久在data/plugin/**底下。如下图：

![last_update_time存储](https://github.com/zzygeo/picx-images-hosting/raw/master/20241101/last_update_time存储.1sf1tcphlk.webp)

## 输出数据到elasticsearch

```config
output {
  stdout { }

  elasticsearch {
    hosts => "http://localhost:9200"
    index => "sys_user" # 决定了document的索引
    document_id => "%{id}" # 采用什么作为数据id，这里取的是查询到的数据的id字段
  }
}
```

## filter

在conf里配置filter用来对数据进行过滤处理，以下是一个示例配置：

```config
filter {
    mutate {
        rename => {
            "update_time" => "updateTime" # 对查询出来的数据改名（比如数据库命名不规范的时候）
        }
        remove_filed => ["password"] # 删除一些字段，删除的字段不会被同步到es里
    }
}
```

##  常见的使用场景

### 多个jdbc参数

在同步数据到es里的时候，可能会出现读取多个表的数据，通过处理以后写入到一个document的需求。下面展示了通过设置type、判断type来实现这一需求到示例。

```json
input {
  jdbc {
    jdbc_driver_library => "/Users/zzy/Downloads/logstash-7.17.9/config/postgresql-42.7.2.jar"
    jdbc_driver_class => "org.postgresql.Driver"
    jdbc_connection_string => "jdbc:postgresql://localhost:5432/gis?currentSchema=public"
    jdbc_user => "zzygeo"
    jdbc_password => "***"
    schedule => "*/30 * * * * *"
    statement => "select id, name, level, nstr, ST_AsText(coordinates) as coordinates, update_time from country where update_time > :sql_last_value and update_time < now() order by update_time asc, id asc"
    jdbc_paging_enabled => true
    jdbc_page_size => 1000
    use_column_value => true
    tracking_column => "update_time"
    tracking_column_type => "timestamp"
    jdbc_default_timezone => "Asia/Shanghai"
    last_run_metadata_path => "/Users/zzy/Downloads/logstash-7.17.9/data/plugins/inputs/jdbc/country_date"
    type => "country"
  }
}

input {
  jdbc {
    jdbc_driver_library => "/Users/zzy/Downloads/logstash-7.17.9/config/postgresql-42.7.2.jar"
    jdbc_driver_class => "org.postgresql.Driver"
    jdbc_connection_string => "jdbc:postgresql://localhost:5432/gis?currentSchema=public&timezone=Asia/Shanghai"
    jdbc_user => "zzygeo"
    jdbc_password => "***"
    schedule => "*/30 * * * * *"
    statement => "select id, name as nstr, ST_AsText(coordinates) as coordinates, village as name, update_time from system_point where update_time > :sql_last_value and update_time < now() order by update_time asc, id asc"
    jdbc_paging_enabled => true
    jdbc_page_size => 10000
    use_column_value => true
    tracking_column => "update_time"
    tracking_column_type => "timestamp"
    jdbc_default_timezone => "Asia/Shanghai"
    last_run_metadata_path => "/Users/zzy/Downloads/logstash-7.17.9/data/plugins/inputs/jdbc/point_date"
    type => "system_point"
  }
}

filter {
  if [type] == "system_point" {
    mutate {
      add_field => ["level", 3]
      add_field => ["combine_id", "system_point:%{id}"]
    }
  } else if [type] == "country" {
    mutate {
      add_field => ["combine_id", "country:%{id}"]
    }
  }
  
}

output {
  elasticsearch {
    hosts => "http://localhost:9200"
    index => "point"
    document_id => "%{combine_id}"
    template => "/Users/zzy/Downloads/logstash-7.17.9/config/test.json"
    template_name => "point_template"
  }
}
```

在上面的示例里，给每个jdbc增加了type属性用来区分表信息，在filter部分，对聚合以后的document id也进行了区分

### 分页参数的使用

当在jdbc里设置jdbc_paging_enabled => true以后，会开启分页查询，jdbc_page_size表示limit的参数，如果不填会给默认值。

jdbc插件的分页，实际上是将sql语句当成了子查询语句，然后再使用limit * offset *的写法对数据进行过滤，切忌排序的时候**不仅要按时间排序，还要按主健id**（碰见过一种情况，updateTime是后来加的字段，表里有很多数据是同一个时间的，这样去分页查询的时候可能会查询出之前页面出现的数据，最终导致导入es的数据条数变少了）。

### 时区的问题

在logstash的里jdbc_default_timezone是对sql语句查询出来的时间进行转换的，**默认会将时间转换为utc时间**，所以一定要理解当前通过jdbc语句查询出来的时间到底是什么时区的。

这里以mysql jdbc和postgres jdbc来举例：

mysql的jdbc有**serverTimezone**参数，由于timestamp存的是时间戳，并不知道时区信息，如果不指定这个参数，会使用和客户端一样的时区进行数据转换。比如客户端使用东八区，那么该连接的时区也被设置为东八区，**当指定了该参数，比如UTC时区，而jvm设置的时区为东八区的时候，查询出来的时间会从被认为utc时间并被转换为东八区的时间。**

pg的jdbc没有这样的参数，pg可以存储**timestampz**的时间戳，会携带时区信息，当查询这样的时间的时候，会**根据jvm的时区自动对服务器查询出来的数据进行转换**（在logstash的例子里，如果启动logstash的jvm设置的是utc时间，而jdbc插件配置里的时区写的是东八区的话，写入本地文件的时间进行一次从东八区到utc的转换，导致时间少了8小时）

**因为这个原因，我在数据同步的时候查询出来的时间总是比数据的最大时间大8个小时，导致每次定时任务都往es里写入大量的数据，cpu一直居高不下，因此生产环境对待时区问题一定要谨慎并且测试。**

### 显式的指定mapping

在output的es插件里，通过指定template参数和template_name可以显示的创建document模板，如下：

```json
output {
  elasticsearch {
    hosts => "http://localhost:9200"
    index => "point"
    document_id => "%{combine_id}"
    template => "/Users/zzy/Downloads/logstash-7.17.9/config/test.json"
    template_name => "point_template"
  }
}
```

template示例（指定了索引名称，mapping，分词规则，扫描文档的间隔）：

```json
{
    "index_patterns": [
        "point" 
    ],
    "settings": {
        "analysis": {
            "analyzer": {
                "location_name": {
                    "type": "custom",
                    "tokenizer": "ik_max_word"
                }
            }
        },
        "index": {
            "refresh_interval": "15s"
        }
    },
    "mappings": {
        "properties": {
            "name": {
                "type": "text",
                "analyzer": "location_name"
            },
            "nstr": {
                "type": "text",
                "analyzer": "location_name"
            },
            "id": {
                "type": "integer"
            },
            "level": {
                "type": "integer"
            },
            "coordinates": {
                "type": "keyword"
            }
        }
    }
}
```
