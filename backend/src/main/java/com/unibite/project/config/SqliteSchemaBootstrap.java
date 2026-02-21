package com.unibite.project.config;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SqliteSchemaBootstrap {

    private final JdbcTemplate jdbcTemplate;

    public SqliteSchemaBootstrap(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureUsersSchema() {
        Boolean hasQrToken = jdbcTemplate.query(
                "PRAGMA table_info(users)",
                rs -> {
                    while (rs.next()) {
                        if ("qr_token".equalsIgnoreCase(rs.getString("name"))) {
                            return true;
                        }
                    }
                    return false;
                }
        );

        if (Boolean.FALSE.equals(hasQrToken)) {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN qr_token varchar(255)");
        }

        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_qr_token ON users(qr_token)");
    }
}
