package github.kaloyanov5.riglab.entity.component_details;

import github.kaloyanov5.riglab.entity.Component;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "cooler_details")
public class CoolerDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @MapsId
    private Component component;

    @NotBlank
    private String coolerType; // Air, AIO Liquid, Custom Loop

    @Positive
    private Integer fanSizeMm; // 120mm, 140mm, etc.

    @Positive
    private Integer maxTdp; // Maximum CPU TDP supported in watts

    private String supportedSockets; // Comma-separated: AM4, AM5, LGA1700, etc.

    @Positive
    private Integer noiseLevel; // dB at max RPM
}

