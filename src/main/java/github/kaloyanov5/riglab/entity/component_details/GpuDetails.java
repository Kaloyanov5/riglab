package github.kaloyanov5.riglab.entity.component_details;

import github.kaloyanov5.riglab.entity.Component;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "gpu_details")
public class GpuDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @MapsId
    private Component component;

    @Positive
    private Integer vram; // GB
    @Positive
    private Integer lengthMm;
    @Positive
    private Integer recommendedPsu;
    @Positive
    private Integer performanceScore;
}
