<template>
  <UHeader :toggle="false">
    <template #title>
      <Logo class="h-4 w-auto" />
    </template>
    <TopbarPlayback />
    <template #right>
      <UColorModeButton size="xs" square />
      <TopbarMenu />
    </template>
  </UHeader>
</template>
