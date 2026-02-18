package github.kaloyanov5.riglab.entity.component_details;

import lombok.Setter;
import lombok.Getter;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotBlank;
import jakarta.persistence.*;
import github.kaloyanov5.riglab.entity.Component;

@Entity
@Setter
@Getter
@Table(name = "storage_details")
public class StorageDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @MapsId
    @OneToOne
    private Component component;

    @Positive
    private Integer writeSpeedMbps;
    @Positive
    private Integer readSpeedMbps;
    @NotBlank
    private String interfaceType; // SATA, M.2, PCIe
    @Positive
    private Integer capacityGb;
    @NotBlank
    private String storageType; // HDD, SSD, NVMe
}





