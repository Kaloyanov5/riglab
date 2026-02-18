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
    private String formFactor; // ATX, Micro-ATX
    @NotBlank
    private String supportedRamType; // DDR4 / DDR5

    @Positive
    private Integer ramSlots; // Number of RAM slots (2, 4, etc.)

    @Positive
    private Integer m2Slots; // Number of M.2 slots for NVMe storage

    @Positive
    private Integer sataConnectors; // Number of SATA ports
}
