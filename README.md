# RigLab ⚙️

PC Configuration Web Platform — Уеб платформа за конфигуриране на персонални компютри с автоматична проверка за съвместимост.

## 📋 Описание

RigLab е уеб приложение, което позволява на потребителите да:
- Разглеждат каталог от PC хардуерни компоненти (CPU, GPU, RAM, Motherboard, PSU, Case, Storage, Cooler)
- Конфигурират PC с интерактивен конфигуратор и **жива проверка за съвместимост** (CPU/MB сокет, RAM тип и капацитет, M.2 слотове, PSU мощност, габарити на корпуса, **TDP на охладителя спрямо CPU**)
- Регистрират потребителски акаунт и **запазват билдове към своя профил**
- Сравняват компоненти от една категория един до друг
- Управляват каталога и потребителите чрез защитен администраторски панел

## 🛠 Технологии

| Категория | Технология |
|---|---|
| Backend | Java 23, Spring Boot 4.0.2 |
| ORM | Spring Data JPA, Hibernate 7.2 |
| Database | MySQL 8.x |
| Security | Spring Security — session-cookie (JSESSIONID), DAO authentication, BCrypt |
| API Docs | SpringDoc OpenAPI / Swagger UI |
| Frontend | HTML5, CSS3, Vanilla JavaScript, Inter (Google Fonts), Lucide icons |
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
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=change_me
   ```
   При първоначално стартиране се създава администраторски акаунт от тези променливи и автоматично се зарежда seed-ът от компоненти (`src/main/resources/data.sql`).

3. Стартирайте приложението:
   ```bash
   ./mvnw spring-boot:run
   ```

4. Отворете в браузъра:
   - Приложение: http://localhost:8080
   - Каталог: http://localhost:8080/pages/components.html
   - Сравнение: http://localhost:8080/pages/compare.html
   - Вход / Регистрация: http://localhost:8080/pages/login.html
   - Запазени билдове: http://localhost:8080/pages/builds.html
   - Swagger UI: http://localhost:8080/swagger-ui.html
   - Admin панел: http://localhost:8080/pages/admin.html

## 🔐 Автентикация и роли

- **USER** — може да създава, преглежда и трие собствените си билдове.
- **ADMIN** — има пълен достъп до администраторския панел и CRUD операциите върху компоненти и потребители.

Сесиите се поддържат чрез `JSESSIONID` cookie. Endpoints:

| Метод | Път | Описание |
|---|---|---|
| `POST` | `/api/auth/register` | Регистрация на нов потребител |
| `POST` | `/api/auth/login` | Вход |
| `POST` | `/api/auth/logout` | Изход |
| `GET`  | `/api/auth/me` | Текущ потребител |

## 🧩 Конфигуратор и съвместимост

- `POST /api/builds` — запазва билд към профила (изисква вход; името на билд е уникално в рамките на потребителя).
- `GET /api/builds/me` — връща билдовете на текущия потребител.
- `POST /api/builds/check-compatibility/batch` — батчова проверка: изпраща текущия билд и списък от кандидат-компоненти за конкретен слот, връща съвместимост и предупреждения наведнъж (използва се от dropdown-ите на конфигуратора, за да се избегнат N HTTP заявки).

## 📁 Структура на проекта

```
src/main/java/github/kaloyanov5/riglab/
├── config/          # SecurityConfig, OpenAPI, admin bootstrap
├── controller/      # AuthController, BuildController, ComponentController, UserController
├── dto/             # Request/Response DTOs (Auth, Build, Compatibility, ...)
├── entity/          # User, Role, Build, Component + component_details/
├── exception/       # GlobalExceptionHandler
├── repository/      # JPA repositories
└── service/         # UserService, BuildService, ComponentService, CompatibilityService, CustomUserDetailsService

src/main/resources/
├── application.yaml # DB и init настройки
├── data.sql         # Seed: 38 компонента (по 6 на категория) с пълни спецификации
└── static/          # Frontend (pages/, js/, css/, assets/)
```

## 📖 Документация

- [Фаза 1: Дефиниция и планиране](docs/PHASE_1_Definition_and_Planning.md)
- [Фаза 2: Проектиране и подготовка](docs/PHASE_2_Design_and_Preparation.md)
