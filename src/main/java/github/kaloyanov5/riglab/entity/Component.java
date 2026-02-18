package github.kaloyanov5.riglab.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
@Table(name = "components")
public class Component {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;
    @NotBlank
    private String brand;

    @Enumerated(EnumType.STRING)
    @NotNull
    private ComponentType type;

    @Positive
    private Double price;

    @Positive
    private Integer powerConsumption; // watts
}
