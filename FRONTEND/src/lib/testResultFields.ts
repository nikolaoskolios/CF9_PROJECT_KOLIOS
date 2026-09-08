// The 10 subsystem test columns from TestData.csv, in CSV column order.
// Shared by the create/edit forms, the detail view, and the attribute
// selector on the list page, so the label/name pairing lives in one place.
export const SUBSYSTEM_TEST_FIELDS = [
  {
    name: "superlaser_concentration_static_check",
    label: "Superlaser Concentration Static Check",
  },
  {
    name: "hypermatter_reactor_core_startup_test",
    label: "Hypermatter Reactor Core Startup Test",
  },
  {
    name: "sublight_ion_engines_sanity_check",
    label: "Sublight Ion Engines Sanity Check",
  },
  {
    name: "superlaser_focal_lenses_coordination_test",
    label: "Superlaser Focal Lenses Coordination Test",
  },
  {
    name: "class_3_hyperdrive_coordinate_input_test",
    label: "Class 3 Hyperdrive Coordinate Input Test",
  },
  {
    name: "deflector_shield_generator_stress_test",
    label: "Deflector Shield Generator Stress Test",
  },
  {
    name: "turbolaser_ion_cannon_power_on_test",
    label: "Turbolaser Ion Cannon Power On Test",
  },
  {
    name: "tractor_beam_projectors_response_test",
    label: "Tractor Beam Projectors Response Test",
  },
  {
    name: "exhaust_ports_control_test",
    label: "Exhaust Ports Control Test",
  },
  {
    name: "kyber_crystal_sample_response_test",
    label: "Kyber Crystal Sample Response Test",
  },
] as const

export type SubsystemTestField = (typeof SUBSYSTEM_TEST_FIELDS)[number]["name"]

// Shared thresholds for the score badges: 0-84% red, 85-95% orange, 96-100% green.
export function getScoreBadgeVariant(
  value: number,
): "default" | "warning" | "destructive" {
  if (value > 95) return "default"
  if (value >= 85) return "warning"
  return "destructive"
}
