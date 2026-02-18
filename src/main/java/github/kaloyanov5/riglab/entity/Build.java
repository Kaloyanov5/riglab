package github.kaloyanov5.riglab.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "builds")
public class Build {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @ManyToOne
    private Component cpu;

    @ManyToOne
    private Component gpu;

    @ManyToOne
    private Component motherboard;

    @ManyToMany
    @JoinTable(
            name = "build_ram",
            joinColumns = @JoinColumn(name = "build_id"),
            inverseJoinColumns = @JoinColumn(name = "component_id")
    )
    private List<Component> ramSticks = new ArrayList<>();

    @ManyToOne
    private Component psu;

    @ManyToOne
    private Component pcCase;

    @ManyToMany
    @JoinTable(
            name = "build_storage",
            joinColumns = @JoinColumn(name = "build_id"),
            inverseJoinColumns = @JoinColumn(name = "component_id")
    )
    private List<Component> storageDevices = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "build_coolers",
            joinColumns = @JoinColumn(name = "build_id"),
            inverseJoinColumns = @JoinColumn(name = "component_id")
    )
    private List<Component> coolers = new ArrayList<>();

    @Positive
    private Double totalPrice;
}
