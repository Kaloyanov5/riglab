package github.kaloyanov5.riglab.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    private Component cpu;

    @ManyToOne(fetch = FetchType.LAZY)
    private Component gpu;

    @ManyToOne(fetch = FetchType.LAZY)
    private Component motherboard;

    @ManyToOne(fetch = FetchType.LAZY)
    private Component psu;

    @ManyToOne(fetch = FetchType.LAZY)
    private Component pcCase;

    // Explicit slots — allow the same Component (e.g. matched RAM kit) in multiple slots.
    @ManyToOne(fetch = FetchType.LAZY) private Component ram1;
    @ManyToOne(fetch = FetchType.LAZY) private Component ram2;
    @ManyToOne(fetch = FetchType.LAZY) private Component ram3;
    @ManyToOne(fetch = FetchType.LAZY) private Component ram4;

    @ManyToOne(fetch = FetchType.LAZY) private Component storage1;
    @ManyToOne(fetch = FetchType.LAZY) private Component storage2;

    @ManyToOne(fetch = FetchType.LAZY) private Component cooler;

    @Positive
    private Double totalPrice;

    public List<Component> getRamSticks() {
        List<Component> list = new ArrayList<>();
        if (ram1 != null) list.add(ram1);
        if (ram2 != null) list.add(ram2);
        if (ram3 != null) list.add(ram3);
        if (ram4 != null) list.add(ram4);
        return list;
    }

    public void setRamSticks(List<Component> rams) {
        ram1 = rams != null && rams.size() > 0 ? rams.get(0) : null;
        ram2 = rams != null && rams.size() > 1 ? rams.get(1) : null;
        ram3 = rams != null && rams.size() > 2 ? rams.get(2) : null;
        ram4 = rams != null && rams.size() > 3 ? rams.get(3) : null;
    }

    public List<Component> getStorageDevices() {
        List<Component> list = new ArrayList<>();
        if (storage1 != null) list.add(storage1);
        if (storage2 != null) list.add(storage2);
        return list;
    }

    public void setStorageDevices(List<Component> storages) {
        storage1 = storages != null && storages.size() > 0 ? storages.get(0) : null;
        storage2 = storages != null && storages.size() > 1 ? storages.get(1) : null;
    }

    public List<Component> getCoolers() {
        return cooler != null ? List.of(cooler) : List.of();
    }

    public void setCoolers(List<Component> coolers) {
        cooler = coolers != null && !coolers.isEmpty() ? coolers.get(0) : null;
    }
}
