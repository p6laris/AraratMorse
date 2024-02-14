using AraratMorse.Components;
using AraratMorse.Models;
using ClipLazor.Extention;
using FluentValidation;
using Fluxor;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");
builder.Services.AddScoped(sp => new HttpClient {BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)});

builder.Services.AddFluxor(o => { o.ScanAssemblies(typeof(Program).Assembly); });

builder.Services.AddClipboard();
builder.Services.AddTransient<IValidator<Settings>, SettingsValidator>();


await builder.Build().RunAsync();