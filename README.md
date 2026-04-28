# RigLab ⚙️

PC Configuration Web Platform — Уеб платформа за конфигуриране на персонални компютри с автоматична проверка за съвместимост.

## 📋 Описание

RigLab е уеб приложение, което позволява на потребителите да:
- Разглеждат каталог от PC хардуерни компоненти (CPU, GPU, RAM, Motherboard, PSU, Case, Storage, Cooler)
- Конфигурират PC с интерактивен конфигуратор с проверка за съвместимост
- Сравняват компоненти от една категория
- Управляват каталога чрез защитен администраторски панел

## 🛠 Технологии

| Категория | Технология |
|---|---|
| Backend | Java 23, Spring Boot 4.0.2 |
| ORM | Spring Data JPA, Hibernate 7.2 |
| Database | MySQL 8.x |
| Security | Spring Security (Basic Auth) |
| API Docs | SpringDoc OpenAPI / Swagger UI |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Build Tool | Maven |

## 🚀 Стартиране

### Предварителни изисквания
- Java 23+
- MySQL 8.x (работещ на `localhost:3306`)
- Maven

### Стъпки

1. Клонирайте хранилището:
   ```bash
   git clone https://github.com/Kaloyanov5/riglab.git
   cd riglab
   ```

2. Конфигурирайте базата данни в `src/main/resources/application.yaml` или чрез environment variables:
   ```
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```

3. Стартирайте приложението:
   ```bash
   ./mvnw spring-boot:run
   ```

4. Отворете в браузъра:
   - Приложение: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html
   - Admin панел: http://localhost:8080/pages/admin.html

## 📁 Структура на проекта

```
src/main/java/github/kaloyanov5/riglab/
├── config/          # Конфигурация (Security, OpenAPI)
├── controller/      # REST контролери
├── dto/             # Data Transfer Objects
├── entity/          # JPA entities + component_details/
├── exception/       # Обработка на грешки
├── repository/      # JPA repositories
└── service/         # Бизнес логика
```

## 📖 Документация

- [Фаза 1: Дефиниция и планиране](docs/PHASE_1_Definition_and_Planning.md)
- [Фаза 2: Проектиране и подготовка](docs/PHASE_2_Design_and_Preparation.md)
