package github.kaloyanov5.riglab.entity.component_details;

import github.kaloyanov5.riglab.entity.Component;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
@Table(name = "motherboard_details")
public class MotherboardDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @MapsId
    private Component component;

    @NotBlank
    private String socket;

    @NotBlank
    private String chipset;

    @NotBlank
    @Column(name = "form_factor")
    private String formFactor;

    @NotBlank
    @Column(name = "supported_ram_type")
    private String supportedRamType;

    @Positive
    @Column(name = "ram_slots")
    private Integer ramSlots;

    @Positive
    @Column(name = "m2_slots")
    private Integer m2Slots;

    @Positive
    @Column(name = "sata_connectors")
    private Integer sataConnectors;
}
