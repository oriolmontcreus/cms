<script lang="ts">
  import SiteHeader from "$lib/components/site-header.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";
  import { onMount } from "svelte";
  import { loggedUser } from "@/stores/loggedUser";
  import { handleGetPages } from "@/services/page.service";
  import { handleGetAllUsers } from "@/services/user.service";
  import { handleTriggerBuild } from "@/services/build.service";
  import type { Page } from "@/lib/shared/types/pages.type";
  import type { User } from "@shared/types/user.type";
  import { SITE_LOCALES } from "@shared/env";
  import { goto } from "$app/navigation";
  import UsersIcon from "@tabler/icons-svelte/icons/users";
  import FileTextIcon from "@tabler/icons-svelte/icons/file-text";
  import BuildingIcon from "@tabler/icons-svelte/icons/hammer";
  import ActivityIcon from "@tabler/icons-svelte/icons/activity";
  import PlusIcon from "@tabler/icons-svelte/icons/plus";
  import EyeIcon from "@tabler/icons-svelte/icons/eye";
  import EditIcon from "@tabler/icons-svelte/icons/edit";
  import SettingsIcon from "@tabler/icons-svelte/icons/settings";
  import TrendingUpIcon from "@tabler/icons-svelte/icons/trending-up";
  import ClockIcon from "@tabler/icons-svelte/icons/clock";
  import CheckCircleIcon from "@tabler/icons-svelte/icons/check";
  import WorldIcon from "@tabler/icons-svelte/icons/world";

  let pages: Page[] = [];
  let users: User[] = [];
  let isLoading = true;
  let isBuildingWelcomeMessage = false;
  let lastBuildResult: { message: string; pagesBuilt: number } | null = null;

  // Statistics
  $: totalPages = pages.length;
  $: totalUsers = users.length;
  $: recentPages = pages
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);
  $: uninitializedUsers = users.filter((u) => !u.isInitialized).length;

  // Get greeting based on time of day
  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }

  function getRoleName(permissions: number): string {
    // Based on the role constants I saw in the codebase
    if (permissions === 7) return "Super Admin";
    if (permissions === 3) return "Developer";
    return "Client";
  }

  function getRoleColor(permissions: number): string {
    if (permissions === 7)
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    if (permissions === 3)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }

  async function loadDashboardData() {
    try {
      const [pagesData, usersData] = await Promise.all([
        handleGetPages(),
        handleGetAllUsers(),
      ]);

      if (pagesData) pages = pagesData;
      if (usersData) users = usersData;
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      isLoading = false;
    }
  }

  async function triggerBuild() {
    isBuildingWelcomeMessage = true;
    try {
      const result = await handleTriggerBuild();
      if (result) {
        lastBuildResult = result;
      }
    } catch (error) {
      console.error("Build failed:", error);
    } finally {
      isBuildingWelcomeMessage = false;
    }
  }

  onMount(() => {
    loadDashboardData();
  });
</script>

<SiteHeader title="Dashboard">
  <Button
    variant="outline"
    size="sm"
    onclick={() => goto("/pages")}
    class="bg-white"
  >
    <PlusIcon size={16} />
    <span class="hidden sm:inline">New Page</span>
  </Button>
</SiteHeader>

<div class="flex flex-1 flex-col">
  <ScrollArea
    class="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6 max-h-[calc(100dvh-80px)]"
  >
    <!-- Welcome Section -->
    {#if $loggedUser}
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {$loggedUser.name || "there"}! 👋
        </h2>
        <p class="text-primary mb-8">
          Here's what's happening with your Excalibur CMS today.
        </p>
      </div>
    {/if}

    <!-- Quick Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Header
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <Card.Title class="text-sm font-medium">Total pages</Card.Title>
          <FileTextIcon class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          {#if isLoading}
            <div class="animate-pulse">
              <div class="h-8 bg-muted rounded w-16 mb-2"></div>
              <div class="h-3 bg-muted rounded w-24"></div>
            </div>
          {:else}
            <div class="text-2xl font-bold">{totalPages}</div>
            <p class="text-xs text-muted-foreground">
              {recentPages.length > 0
                ? `${recentPages.length} recently updated`
                : "No recent updates"}
            </p>
          {/if}
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <Card.Title class="text-sm font-medium">Users</Card.Title>
          <UsersIcon class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          {#if isLoading}
            <div class="animate-pulse">
              <div class="h-8 bg-muted rounded w-16 mb-2"></div>
              <div class="h-3 bg-muted rounded w-32"></div>
            </div>
          {:else}
            <div class="text-2xl font-bold">{totalUsers}</div>
            <p class="text-xs text-muted-foreground">
              {uninitializedUsers > 0
                ? `${uninitializedUsers} pending setup`
                : `${totalUsers} total member${totalUsers !== 1 ? "s" : ""}`}
            </p>
          {/if}
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <Card.Title class="text-sm font-medium">Locales</Card.Title>
          <WorldIcon class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          {#if isLoading}
            <div class="animate-pulse">
              <div class="h-8 bg-muted rounded w-12 mb-2"></div>
              <div class="h-3 bg-muted rounded w-20"></div>
            </div>
          {:else}
            <div class="text-2xl font-bold">{SITE_LOCALES.length}</div>
            <p class="text-xs text-muted-foreground">
              {SITE_LOCALES.map((locale) => locale.name).join(", ")}
            </p>
          {/if}
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <Card.Title class="text-sm font-medium">Quick actions</Card.Title>
          <TrendingUpIcon class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content class="space-y-2">
          {#if isLoading}
            <div class="animate-pulse">
              <div class="h-8 bg-muted rounded w-full"></div>
            </div>
          {:else}
            <Button
              variant="outline"
              size="sm"
              class="w-full justify-start"
              disabled={isBuildingWelcomeMessage}
              onclick={triggerBuild}
            >
              <BuildingIcon size={14} />
              {isBuildingWelcomeMessage ? "Building..." : "Build Site"}
            </Button>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <div class="grid gap-4 lg:grid-cols-2 mt-4">
      <!-- Recent Pages -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center justify-between">
            <Card.Title class="flex items-center gap-2 font-normal">
              Recent pages
            </Card.Title>
            <Button variant="outline" size="sm" onclick={() => goto("/pages")}>
              View all
            </Button>
          </div>
          <Card.Description>
            Pages that have been recently updated
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if isLoading}
            <div class="space-y-3">
              {#each Array(3) as _}
                <div class="animate-pulse">
                  <div class="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div class="h-3 bg-muted rounded w-1/2"></div>
                </div>
              {/each}
            </div>
          {:else if recentPages.length === 0}
            <div class="text-center py-6 text-muted-foreground">
              <FileTextIcon class="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pages created yet</p>
              <Button
                variant="outline"
                size="sm"
                class="mt-3"
                onclick={() => goto("/pages")}
              >
                Create your first page
              </Button>
            </div>
          {:else}
            <div class="space-y-4">
              {#each recentPages as page}
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium truncate">{page.title}</h4>
                      <Badge variant="secondary" class="text-xs">
                        /{page.slug}
                      </Badge>
                    </div>
                    <div class="flex items-center gap-4 mt-1">
                      <span
                        class="text-xs text-muted-foreground flex items-center gap-1"
                      >
                        <ClockIcon size={12} />
                        {formatDate(page.updatedAt)}
                      </span>
                      <span class="text-xs text-muted-foreground">
                        {page.components.length} component{page.components
                          .length !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => goto(`/pages/${page.slug}`)}
                    >
                      <EditIcon size={14} />
                    </Button>
                  </div>
                </div>
                {#if recentPages.indexOf(page) < recentPages.length - 1}
                  <Separator />
                {/if}
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Team Overview -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center justify-between">
            <Card.Title class="flex items-center gap-2 font-normal">
              Team overview
            </Card.Title>
            {#if $loggedUser?.permissions === 7}
              <Button
                variant="outline"
                size="sm"
                onclick={() => goto("/users")}
              >
                Manage
              </Button>
            {/if}
          </div>
          <Card.Description>
            Active team members and their roles
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if isLoading}
            <div class="space-y-3">
              {#each Array(3) as _}
                <div class="animate-pulse">
                  <div class="h-4 bg-muted rounded w-2/3 mb-2"></div>
                  <div class="h-3 bg-muted rounded w-1/3"></div>
                </div>
              {/each}
            </div>
          {:else if users.length === 0}
            <div class="text-center py-6 text-muted-foreground">
              <UsersIcon class="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No team members found</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each users.slice(0, 5) as user}
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium truncate">
                        {user.name || "Unnamed User"}
                      </h4>
                      {#if !user.isInitialized}
                        <Badge
                          variant="outline"
                          class="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                        >
                          Pending setup
                        </Badge>
                      {/if}
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs text-muted-foreground"
                        >{user.email}</span
                      >
                      <Badge
                        class={`text-xs ${getRoleColor(user.permissions)}`}
                      >
                        {getRoleName(user.permissions)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {#if users.indexOf(user) < Math.min(users.length - 1, 4)}
                  <Separator />
                {/if}
              {/each}
              {#if users.length > 5}
                <div class="text-center pt-2">
                  <span class="text-xs text-muted-foreground">
                    +{users.length - 5} more member{users.length - 5 !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              {/if}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <!-- System Status -->
    {#if lastBuildResult}
      <Card.Root
        class="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      >
        <Card.Header>
          <Card.Title
            class="flex items-center gap-2 text-green-700 dark:text-green-300"
          >
            <CheckCircleIcon class="h-5 w-5" />
            Latest Build Successful
          </Card.Title>
          <Card.Description class="text-green-600 dark:text-green-400">
            {lastBuildResult.message} - {lastBuildResult.pagesBuilt} pages built
            successfully
          </Card.Description>
        </Card.Header>
      </Card.Root>
    {/if}
  </ScrollArea>
</div>
