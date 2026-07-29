[out:json][timeout:90];
(
  way["highway"~"motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street"](-34.557,-58.534,-34.528,-58.496);
  way["railway"~"rail|light_rail|subway|tram"](-34.557,-58.534,-34.528,-58.496);
);
out tags geom qt;
