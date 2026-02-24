package github.kaloyanov5.riglab.entity;

import github.kaloyanov5.riglab.entity.component_details.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
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

    @PositiveOrZero
    private Integer powerConsumption; // watts

    private String imageUrl;

    @OneToOne(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private CpuDetails cpuDetails;

    @OneToOne(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private GpuDetails gpuDetails;

    @OneToOne(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private MotherboardDetails motherboardDetails;

    @OneToOne(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private RamDetails ramDetails;

    @OneToOne(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private PsuDetails psuDetails;

    @OneToOne(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private CaseDetails caseDetails;

    @OneToOne(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private StorageDetails storageDetails;

    @OneToOne(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private CoolerDetails coolerDetails;
}
