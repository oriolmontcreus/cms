<!-- +page.svelte -->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { Button } from '@components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';

    function handleCreatePage() {
        // For now, we'll just redirect to the terminal instructions
        goto('/pages');
    }
</script>

<div class="max-w-2xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-8">Create New Page</h1>

    <Card>
        <CardHeader>
            <CardTitle>Using the Terminal</CardTitle>
            <CardDescription>
                To create a new page with a form builder configuration, use the terminal command:
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div class="bg-gray-100 p-4 rounded-md font-mono text-sm mb-4">
                cd cms/scripts && npm run create-page
            </div>
            <p class="text-sm text-gray-600 mb-4">
                This interactive command will help you:
            </p>
            <ul class="list-disc list-inside text-sm text-gray-600 space-y-2 mb-6">
                <li>Set the page title and URL</li>
                <li>Add form fields of different types (text, textarea, number, date, select)</li>
                <li>Configure validation and requirements for each field</li>
                <li>Add placeholder text and options for select fields</li>
            </ul>
            <Button onclick={() => goto('/pages')}>Back to Pages</Button>
        </CardContent>
    </Card>
</div> 